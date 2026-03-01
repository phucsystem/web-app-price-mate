using PriceMate.Application.DTOs.Common;
using PriceMate.Application.DTOs.Deals;
using PriceMate.Application.Interfaces;

namespace PriceMate.API.Endpoints;

public static class DealEndpoints
{
    public static void MapDealEndpoints(this WebApplication app)
    {
        app.MapGet("/api/deals", async (
            Guid? cursor,
            int limit,
            string? sort,
            string? category,
            IDealService dealService,
            CancellationToken ct) =>
        {
            var pagination = new CursorPaginationParams(cursor, limit == 0 ? 20 : limit, sort ?? "drop_pct");
            var result = await dealService.GetDealsAsync(pagination, category, ct);
            var meta = new PaginationMeta(result.NextCursor, result.HasMore);
            return Results.Ok(new ApiResponse<List<DealDto>>(result.Items, meta));
        }).RequireRateLimiting("general");
    }
}
