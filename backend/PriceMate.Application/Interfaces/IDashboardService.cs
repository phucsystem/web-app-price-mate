using PriceMate.Application.DTOs.Common;
using PriceMate.Application.DTOs.Dashboard;

namespace PriceMate.Application.Interfaces;

public interface IDashboardService
{
    Task<(DashboardResponse Dashboard, string? NextCursor, bool HasMore)> GetDashboardAsync(
        Guid userId, CursorPaginationParams pagination, CancellationToken ct);
}
