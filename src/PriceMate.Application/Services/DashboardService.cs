using Microsoft.EntityFrameworkCore;
using PriceMate.Application.DTOs.Common;
using PriceMate.Application.DTOs.Dashboard;
using PriceMate.Application.Helpers;
using PriceMate.Application.Interfaces;

namespace PriceMate.Application.Services;

public class DashboardService(IApplicationDbContext dbContext) : IDashboardService
{
    public async Task<(DashboardResponse Dashboard, string? NextCursor, bool HasMore)> GetDashboardAsync(
        Guid userId, CursorPaginationParams pagination, CancellationToken ct)
    {
        var limit = pagination.ClampedLimit;
        var recentDropCutoff = DateTime.UtcNow.AddDays(-7);

        var totalTracked = await dbContext.TrackedItems.CountAsync(ti => ti.UserId == userId, ct);
        var activeAlerts = await dbContext.TrackedItems.CountAsync(ti => ti.UserId == userId && ti.IsActive && ti.TargetPrice != null, ct);

        var recentDrops = await dbContext.TrackedItems
            .Where(ti => ti.UserId == userId)
            .Join(dbContext.PriceRecords,
                ti => ti.ProductId,
                pr => pr.ProductId,
                (ti, pr) => new { ti, pr })
            .CountAsync(x => x.pr.RecordedAt >= recentDropCutoff, ct);

        var query = dbContext.TrackedItems
            .Include(ti => ti.Product)
            .ThenInclude(p => p.PriceRecords)
            .Where(ti => ti.UserId == userId);

        if (pagination.Cursor.HasValue)
            query = query.Where(ti => ti.Id.CompareTo(pagination.Cursor.Value) > 0);

        query = pagination.Sort switch
        {
            "name" => query.OrderBy(ti => ti.Product.Title),
            "price_drop" => query.OrderByDescending(ti => ti.Product.HighestPrice - ti.Product.CurrentPrice),
            _ => query.OrderByDescending(ti => ti.CreatedAt)
        };

        var trackedItems = await query.Take(limit + 1).ToListAsync(ct);

        var hasMore = trackedItems.Count > limit;
        if (hasMore) trackedItems.RemoveAt(trackedItems.Count - 1);

        var items = trackedItems.Select(ti =>
        {
            var product = ti.Product;
            var recentPrices = product.PriceRecords
                .OrderByDescending(pr => pr.RecordedAt)
                .Take(6)
                .Select(pr => pr.Price)
                .ToList();

            var sparkline = recentPrices.Take(5).Reverse().ToList();
            var previousPrice = recentPrices.Count > 1 ? recentPrices[1] : (decimal?)null;

            PriceChangeDto? priceChange = null;
            if (previousPrice.HasValue && previousPrice.Value != 0)
            {
                var amount = product.CurrentPrice - previousPrice.Value;
                var percentage = Math.Round(amount / previousPrice.Value * 100, 1);
                priceChange = new PriceChangeDto(amount, percentage);
            }

            return new TrackedItemDto(
                ti.Id,
                new ProductSummaryDto(product.Asin, product.Title, product.ImageUrl, product.CurrentPrice),
                ti.TargetPrice,
                ti.IsActive,
                priceChange,
                DealScoreCalculator.Calculate(product.CurrentPrice, product.LowestPrice, product.HighestPrice),
                sparkline,
                ti.CreatedAt
            );
        }).ToList();

        var summary = new DashboardSummary(totalTracked, activeAlerts, recentDrops);
        var nextCursor = hasMore ? trackedItems.Last().Id.ToString() : null;

        return (new DashboardResponse(summary, items), nextCursor, hasMore);
    }
}
