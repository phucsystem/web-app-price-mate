using Microsoft.EntityFrameworkCore;
using PriceMate.Application.DTOs.Common;

using PriceMate.Application.DTOs.Dashboard;
using PriceMate.Application.DTOs.Products;
using PriceMate.Application.Helpers;
using PriceMate.Application.Interfaces;
using PriceMate.Domain.Entities;

namespace PriceMate.Application.Services;

public class ProductService(IApplicationDbContext dbContext) : IProductService
{
    public async Task<PagedResponse<ProductDto>> SearchAsync(string query, CursorPaginationParams pagination, CancellationToken ct)
    {
        var limit = pagination.ClampedLimit;
        var dbQuery = dbContext.Products
            .Include(p => p.Category)
            .Where(p => p.Title.Contains(query) || p.Asin == query);

        if (pagination.Cursor.HasValue)
            dbQuery = dbQuery.Where(p => p.Id.CompareTo(pagination.Cursor.Value) > 0);

        var items = await dbQuery
            .OrderBy(p => p.Id)
            .Take(limit + 1)
            .ToListAsync(ct);

        var hasMore = items.Count > limit;
        if (hasMore) items.RemoveAt(items.Count - 1);

        var dtos = items.Select(MapToProductDto).ToList();
        var nextCursor = hasMore ? items.Last().Id.ToString() : null;

        return new PagedResponse<ProductDto>(dtos, nextCursor, hasMore);
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

    private static ProductDto MapToProductDto(Product product) => new(
        product.Asin,
        product.Title,
        product.ImageUrl,
        product.CurrentPrice,
        product.AmazonUrl,
        DealScoreCalculator.Calculate(product.CurrentPrice, product.LowestPrice, product.HighestPrice),
        product.Category?.Name
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
        if (!url.Contains("amazon.com.au", StringComparison.OrdinalIgnoreCase))
            return null;

        var dpIndex = url.IndexOf("/dp/", StringComparison.OrdinalIgnoreCase);
        if (dpIndex < 0) return null;

        var start = dpIndex + 4;
        var end = url.IndexOfAny(['/', '?', '#'], start);
        return end < 0 ? url[start..] : url[start..end];
    }
}
