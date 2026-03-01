using System.Text;
using Microsoft.EntityFrameworkCore;
using PriceMate.Application.DTOs.Dashboard;
using PriceMate.Application.Helpers;
using PriceMate.Application.Interfaces;

namespace PriceMate.Application.Services;

public class TrackedItemService(IApplicationDbContext dbContext) : ITrackedItemService
{
    public async Task<TrackedItemSummaryDto> SetAlertAsync(Guid userId, Guid trackedItemId, decimal targetPrice, CancellationToken ct)
    {
        var trackedItem = await dbContext.TrackedItems
            .FirstOrDefaultAsync(ti => ti.Id == trackedItemId && ti.UserId == userId, ct)
            ?? throw new KeyNotFoundException("Tracked item not found.");

        trackedItem.TargetPrice = targetPrice;
        trackedItem.IsActive = true;
        await dbContext.SaveChangesAsync(ct);

        return new TrackedItemSummaryDto(trackedItem.Id, trackedItem.TargetPrice, trackedItem.IsActive);
    }

    public async Task<TrackedItemSummaryDto> UpdateAlertAsync(Guid userId, Guid trackedItemId, decimal targetPrice, CancellationToken ct)
    {
        var trackedItem = await dbContext.TrackedItems
            .FirstOrDefaultAsync(ti => ti.Id == trackedItemId && ti.UserId == userId, ct)
            ?? throw new KeyNotFoundException("Tracked item not found.");

        trackedItem.TargetPrice = targetPrice;
        await dbContext.SaveChangesAsync(ct);

        return new TrackedItemSummaryDto(trackedItem.Id, trackedItem.TargetPrice, trackedItem.IsActive);
    }

    public async Task RemoveAsync(Guid userId, Guid trackedItemId, CancellationToken ct)
    {
        var trackedItem = await dbContext.TrackedItems
            .FirstOrDefaultAsync(ti => ti.Id == trackedItemId && ti.UserId == userId, ct)
            ?? throw new KeyNotFoundException("Tracked item not found.");

        dbContext.TrackedItems.Remove(trackedItem);
        await dbContext.SaveChangesAsync(ct);
    }

    public async Task<byte[]> ExportCsvAsync(Guid userId, CancellationToken ct)
    {
        var items = await dbContext.TrackedItems
            .Include(ti => ti.Product)
            .Where(ti => ti.UserId == userId)
            .OrderBy(ti => ti.Product.Title)
            .ToListAsync(ct);

        var sb = new StringBuilder();
        sb.AppendLine("Product,ASIN,Current Price,Target Price,Lowest,Highest,Status");

        foreach (var item in items)
        {
            var product = item.Product;
            var dealScore = DealScoreCalculator.Calculate(product.CurrentPrice, product.LowestPrice, product.HighestPrice) ?? "none";
            sb.AppendLine($"\"{EscapeCsv(product.Title)}\",{product.Asin},{product.CurrentPrice},{item.TargetPrice},{product.LowestPrice},{product.HighestPrice},{dealScore}");
        }

        return Encoding.UTF8.GetBytes(sb.ToString());
    }

    private static string EscapeCsv(string value) => value.Replace("\"", "\"\"");
}
