using PriceMate.Application.DTOs.Dashboard;

namespace PriceMate.Application.Interfaces;

public interface ITrackedItemService
{
    Task<TrackedItemSummaryDto> SetAlertAsync(Guid userId, Guid trackedItemId, decimal targetPrice, CancellationToken ct);
    Task<TrackedItemSummaryDto> UpdateAlertAsync(Guid userId, Guid trackedItemId, decimal targetPrice, CancellationToken ct);
    Task RemoveAsync(Guid userId, Guid trackedItemId, CancellationToken ct);
    Task<byte[]> ExportCsvAsync(Guid userId, CancellationToken ct);
}
