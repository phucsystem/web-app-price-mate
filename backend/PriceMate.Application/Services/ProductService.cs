using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using PriceMate.Application.DTOs.Amazon;
using PriceMate.Application.DTOs.Common;
using PriceMate.Application.DTOs.Dashboard;
using PriceMate.Application.DTOs.Products;
using PriceMate.Application.Helpers;
using PriceMate.Application.Interfaces;
using PriceMate.Domain.Entities;

namespace PriceMate.Application.Services;

public class ProductService(
    IApplicationDbContext dbContext,
    IAmazonProductService amazonProductService,
    ILogger<ProductService> logger) : IProductService
{
    public async Task<PagedResponse<ProductDto>> SearchAsync(string query, CursorPaginationParams pagination, CancellationToken ct)
    {
        var limit = pagination.ClampedLimit;

        // URL path — extract ASIN and look up directly via Amazon API
        var asin = ExtractAsin(query);
        if (asin is not null)
        {
            var productDto = await GetOrFetchByAsinAsync(asin, ct);
            if (productDto is not null)
                return new PagedResponse<ProductDto>([productDto], null, false);
            return new PagedResponse<ProductDto>([], null, false);
        }

        // Keyword search — try local DB first
        var dbQuery = dbContext.Products
            .Include(p => p.Category)
            .Where(p => p.Title.Contains(query));

        if (pagination.Cursor.HasValue)
            dbQuery = dbQuery.Where(p => p.Id.CompareTo(pagination.Cursor.Value) > 0);

        var items = await dbQuery
            .OrderBy(p => p.Id)
            .Take(limit + 1)
            .ToListAsync(ct);

        var hasMore = items.Count > limit;
        if (hasMore) items.RemoveAt(items.Count - 1);

        if (items.Count > 0)
        {
            var dtos = items.Select(MapToProductDto).ToList();
            var nextCursor = hasMore ? items.Last().Id.ToString() : null;
            return new PagedResponse<ProductDto>(dtos, nextCursor, hasMore);
        }

        // Local DB empty — fall back to Amazon PA API
        var amazonResults = await SearchAmazonAsync(query, limit, ct);
        if (amazonResults.Count > 0)
            await UpsertProductsAsync(amazonResults, ct);

        var resultDtos = amazonResults.Select(MapAmazonResultToProductDto).ToList();
        return new PagedResponse<ProductDto>(resultDtos, null, false);
    }

    public async Task<ProductDetailDto> GetByAsinAsync(string asin, Guid? userId, CancellationToken ct)
    {
        var product = await dbContext.Products
            .Include(p => p.Category)
            .FirstOrDefaultAsync(p => p.Asin == asin, ct)
            ?? throw new KeyNotFoundException($"Product with ASIN '{asin}' not found.");

        TrackedItemSummaryDto? trackedItem = null;
        if (userId.HasValue)
        {
            var tracked = await dbContext.TrackedItems
                .FirstOrDefaultAsync(ti => ti.ProductId == product.Id && ti.UserId == userId.Value, ct);
            if (tracked is not null)
                trackedItem = new TrackedItemSummaryDto(tracked.Id, tracked.TargetPrice, tracked.IsActive);
        }

        return new ProductDetailDto(
            product.Asin,
            product.Title,
            product.ImageUrl,
            product.AmazonUrl,
            product.CurrentPrice,
            product.LowestPrice,
            product.HighestPrice,
            product.AveragePrice,
            DealScoreCalculator.Calculate(product.CurrentPrice, product.LowestPrice, product.HighestPrice),
            product.Category is not null ? new ProductCategoryDto(product.Category.Name, product.Category.Slug) : null,
            product.LastFetchedAt,
            trackedItem
        );
    }

    public async Task<List<PriceRecordDto>> GetPriceHistoryAsync(string asin, string range, CancellationToken ct)
    {
        var product = await dbContext.Products
            .FirstOrDefaultAsync(p => p.Asin == asin, ct)
            ?? throw new KeyNotFoundException($"Product with ASIN '{asin}' not found.");

        var cutoff = GetRangeCutoff(range);
        var query = dbContext.PriceRecords
            .Where(pr => pr.ProductId == product.Id);

        if (cutoff.HasValue)
            query = query.Where(pr => pr.RecordedAt >= cutoff.Value);

        var records = await query
            .OrderByDescending(pr => pr.RecordedAt)
            .Select(pr => new PriceRecordDto(pr.Price, pr.RecordedAt))
            .ToListAsync(ct);

        return records;
    }

    public async Task<TrackedItemDto> TrackByUrlAsync(Guid userId, TrackUrlRequest request, CancellationToken ct)
    {
        var asin = ExtractAsin(request.AmazonUrl)
            ?? throw new ArgumentException("Invalid Amazon AU URL. Could not extract ASIN.");

        var product = await dbContext.Products
            .Include(p => p.Category)
            .FirstOrDefaultAsync(p => p.Asin == asin, ct);

        if (product is null)
        {
            product = new Product
            {
                Id = Guid.NewGuid(),
                Asin = asin,
                Title = asin,
                AmazonUrl = request.AmazonUrl,
                CreatedAt = DateTime.UtcNow
            };
            dbContext.Products.Add(product);
        }

        var existing = await dbContext.TrackedItems
            .FirstOrDefaultAsync(ti => ti.UserId == userId && ti.ProductId == product.Id, ct);

        if (existing is not null)
            throw new InvalidOperationException("Product is already being tracked.");

        var trackedItem = new TrackedItem
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            ProductId = product.Id,
            TargetPrice = request.TargetPrice,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        dbContext.TrackedItems.Add(trackedItem);
        await dbContext.SaveChangesAsync(ct);

        return new TrackedItemDto(
            trackedItem.Id,
            new ProductSummaryDto(product.Asin, product.Title, product.ImageUrl, product.CurrentPrice),
            trackedItem.TargetPrice,
            trackedItem.IsActive,
            null,
            DealScoreCalculator.Calculate(product.CurrentPrice, product.LowestPrice, product.HighestPrice),
            new List<decimal>(),
            trackedItem.CreatedAt
        );
    }

    // --- Private helpers ---

    private async Task<ProductDto?> GetOrFetchByAsinAsync(string asin, CancellationToken ct)
    {
        var existing = await dbContext.Products
            .Include(p => p.Category)
            .FirstOrDefaultAsync(p => p.Asin == asin, ct);

        if (existing is not null)
            return MapToProductDto(existing);

        var amazonItems = await FetchAmazonByAsinsAsync([asin], ct);
        if (amazonItems.Count == 0)
            return null;

        await UpsertProductsAsync(
            amazonItems.Select(item => new AmazonSearchResult(
                item.Asin,
                item.Title ?? item.Asin,
                item.ImageUrl,
                item.CurrentPrice,
                $"https://www.amazon.com.au/dp/{item.Asin}",
                null
            )).ToList(), ct);

        return new ProductDto(
            amazonItems[0].Asin,
            amazonItems[0].Title ?? amazonItems[0].Asin,
            amazonItems[0].ImageUrl,
            amazonItems[0].CurrentPrice ?? 0m,
            $"https://www.amazon.com.au/dp/{amazonItems[0].Asin}",
            null,
            null
        );
    }

    private async Task<List<AmazonSearchResult>> SearchAmazonAsync(string query, int limit, CancellationToken ct)
    {
        try
        {
            return await amazonProductService.SearchItemsAsync(query, limit, ct);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Amazon PA API search failed for query '{Query}'. Returning empty results.", query);
            return [];
        }
    }

    private async Task<List<AmazonProductData>> FetchAmazonByAsinsAsync(List<string> asins, CancellationToken ct)
    {
        try
        {
            return await amazonProductService.GetItemsByAsinAsync(asins, ct);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Amazon PA API ASIN lookup failed for {Asins}. Returning empty results.", string.Join(",", asins));
            return [];
        }
    }

    private async Task UpsertProductsAsync(List<AmazonSearchResult> results, CancellationToken ct)
    {
        var asins = results.Select(r => r.Asin).ToList();
        var existing = await dbContext.Products
            .Where(p => asins.Contains(p.Asin))
            .ToDictionaryAsync(p => p.Asin, ct);

        foreach (var result in results)
        {
            if (string.IsNullOrWhiteSpace(result.Asin)) continue;

            var price = result.Price ?? 0m;

            if (existing.TryGetValue(result.Asin, out var product))
            {
                product.Title = result.Title;
                product.ImageUrl = result.ImageUrl;
                product.CurrentPrice = price;
                product.LastFetchedAt = DateTime.UtcNow;
            }
            else
            {
                dbContext.Products.Add(new Product
                {
                    Id = Guid.NewGuid(),
                    Asin = result.Asin,
                    Title = result.Title,
                    ImageUrl = result.ImageUrl,
                    AmazonUrl = result.AmazonUrl,
                    CurrentPrice = price,
                    LowestPrice = price,
                    HighestPrice = price,
                    AveragePrice = price,
                    LastFetchedAt = DateTime.UtcNow,
                    CreatedAt = DateTime.UtcNow
                });
            }
        }

        try
        {
            await dbContext.SaveChangesAsync(ct);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to upsert Amazon products to DB.");
        }
    }

    private static ProductDto MapToProductDto(Product product) => new(
        product.Asin,
        product.Title,
        product.ImageUrl,
        product.CurrentPrice,
        product.AmazonUrl,
        DealScoreCalculator.Calculate(product.CurrentPrice, product.LowestPrice, product.HighestPrice),
        product.Category?.Name
    );

    private static ProductDto MapAmazonResultToProductDto(AmazonSearchResult result) => new(
        result.Asin,
        result.Title,
        result.ImageUrl,
        result.Price ?? 0m,
        result.AmazonUrl,
        null,
        result.Category
    );

    private static DateTime? GetRangeCutoff(string range) => range switch
    {
        "30d" => DateTime.UtcNow.AddDays(-30),
        "90d" => DateTime.UtcNow.AddDays(-90),
        "180d" => DateTime.UtcNow.AddDays(-180),
        "1y" => DateTime.UtcNow.AddYears(-1),
        "all" => null,
        _ => DateTime.UtcNow.AddDays(-90)
    };

    private static string? ExtractAsin(string url)
    {
        if (!url.Contains("amazon.com.au", StringComparison.OrdinalIgnoreCase) &&
            !url.Contains("/dp/", StringComparison.OrdinalIgnoreCase))
            return null;

        var dpIndex = url.IndexOf("/dp/", StringComparison.OrdinalIgnoreCase);
        if (dpIndex < 0) return null;

        var start = dpIndex + 4;
        var end = url.IndexOfAny(['/', '?', '#'], start);
        return end < 0 ? url[start..] : url[start..end];
    }
}
