using Microsoft.EntityFrameworkCore;
using PriceMate.Application.DTOs.Common;
using PriceMate.Application.DTOs.Dashboard;
using PriceMate.Application.DTOs.Deals;
using PriceMate.Application.Helpers;
using PriceMate.Application.Interfaces;

namespace PriceMate.Application.Services;

public class DealService(IApplicationDbContext dbContext) : IDealService
{
    public async Task<PagedResponse<DealDto>> GetDealsAsync(CursorPaginationParams pagination, string? categorySlug, CancellationToken ct)
    {
        var limit = pagination.ClampedLimit;
        var query = dbContext.Products
            .Include(p => p.Category)
            .Include(p => p.PriceRecords)
            .Where(p => p.HighestPrice > p.CurrentPrice);

        if (!string.IsNullOrEmpty(categorySlug))
            query = query.Where(p => p.Category.Slug == categorySlug);

        if (pagination.Cursor.HasValue)
            query = query.Where(p => p.Id.CompareTo(pagination.Cursor.Value) > 0);

        query = pagination.Sort switch
        {
            "price_asc" => query.OrderBy(p => p.CurrentPrice),
            "category" => query.OrderBy(p => p.Category.Name).ThenBy(p => p.Id),
            _ => query.OrderByDescending(p => (p.HighestPrice - p.CurrentPrice) / p.HighestPrice)
        };

        var items = await query.Take(limit + 1).ToListAsync(ct);
        var hasMore = items.Count > limit;
        if (hasMore) items.RemoveAt(items.Count - 1);

        var dtos = items.Select(p =>
        {
            var previousPrice = p.PriceRecords
                .OrderByDescending(pr => pr.RecordedAt)
                .Skip(1)
                .Select(pr => pr.Price)
                .FirstOrDefault();

            PriceChangeDto? priceChange = null;
            if (previousPrice > 0)
            {
                var amount = p.CurrentPrice - previousPrice;
                var percentage = Math.Round(amount / previousPrice * 100, 1);
                priceChange = new PriceChangeDto(amount, percentage);
            }

            return new DealDto(
                p.Asin,
                p.Title,
                p.ImageUrl,
                p.CurrentPrice,
                previousPrice > 0 ? previousPrice : null,
                priceChange,
                DealScoreCalculator.Calculate(p.CurrentPrice, p.LowestPrice, p.HighestPrice),
                p.AmazonUrl,
                p.Category?.Name
            );
        }).ToList();

        var nextCursor = hasMore ? items.Last().Id.ToString() : null;
        return new PagedResponse<DealDto>(dtos, nextCursor, hasMore);
    }
}
