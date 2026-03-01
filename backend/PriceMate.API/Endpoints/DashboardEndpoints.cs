using System.Security.Claims;
using PriceMate.Application.DTOs.Common;
using PriceMate.Application.DTOs.Dashboard;
using PriceMate.Application.Interfaces;

namespace PriceMate.API.Endpoints;

public static class DashboardEndpoints
{
    public static void MapDashboardEndpoints(this WebApplication app)
    {
        app.MapGet("/api/dashboard", async (
            Guid? cursor,
            int limit,
            string? sort,
            HttpContext httpContext,
            IDashboardService dashboardService,
            CancellationToken ct) =>
        {
            var userIdClaim = httpContext.User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? httpContext.User.FindFirstValue("sub");

            if (!Guid.TryParse(userIdClaim, out var userId))
                return Results.Unauthorized();

            var pagination = new CursorPaginationParams(cursor, limit == 0 ? 20 : limit, sort ?? "date_added");
            var (dashboard, nextCursor, hasMore) = await dashboardService.GetDashboardAsync(userId, pagination, ct);
            var meta = new PaginationMeta(nextCursor, hasMore);

            return Results.Ok(new ApiResponse<DashboardResponse>(dashboard, meta));
        }).RequireAuthorization().RequireRateLimiting("general");
    }
}
