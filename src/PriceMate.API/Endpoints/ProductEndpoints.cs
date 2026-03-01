using System.Security.Claims;
using PriceMate.Application.DTOs.Common;
using PriceMate.Application.DTOs.Products;
using PriceMate.Application.Interfaces;

namespace PriceMate.API.Endpoints;

public static class ProductEndpoints
{
    public static void MapProductEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/products");

        group.MapGet("/search", async (
            string q,
            Guid? cursor,
            int limit,
            IProductService productService,
            CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(q))
                return Results.BadRequest(new { error = new { code = "VALIDATION_ERROR", message = "Query parameter 'q' is required." } });

            var pagination = new CursorPaginationParams(cursor, limit == 0 ? 20 : limit);
            var result = await productService.SearchAsync(q, pagination, ct);
            var meta = new PaginationMeta(result.NextCursor, result.HasMore, result.TotalEstimate);
            return Results.Ok(new ApiResponse<List<ProductDto>>(result.Items, meta));
        }).RequireRateLimiting("search");

        group.MapGet("/{asin}/prices", async (
            string asin,
            string? range,
            IProductService productService,
            CancellationToken ct) =>
        {
            var records = await productService.GetPriceHistoryAsync(asin, range ?? "90d", ct);
            var meta = new PaginationMeta(null, false, records.Count);
            return Results.Ok(new ApiResponse<List<PriceRecordDto>>(records, meta));
        }).RequireRateLimiting("general");

        group.MapGet("/{asin}", async (
            string asin,
            HttpContext httpContext,
            IProductService productService,
            CancellationToken ct) =>
        {
            var userIdClaim = httpContext.User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? httpContext.User.FindFirstValue("sub");
            Guid.TryParse(userIdClaim, out var userId);

            var product = await productService.GetByAsinAsync(asin, userId == Guid.Empty ? null : userId, ct);
            return Results.Ok(new ApiResponse<ProductDetailDto>(product));
        }).RequireRateLimiting("general");

        group.MapPost("/track-url", async (
            TrackUrlRequest request,
            HttpContext httpContext,
            IProductService productService,
            CancellationToken ct) =>
        {
            var userIdClaim = httpContext.User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? httpContext.User.FindFirstValue("sub");

            if (!Guid.TryParse(userIdClaim, out var userId))
                return Results.Unauthorized();

            var trackedItem = await productService.TrackByUrlAsync(userId, request, ct);
            return Results.Created($"/api/products/{trackedItem.Product.Asin}", new ApiResponse<object>(new
            {
                trackedItem = new { trackedItem.TrackedItemId, trackedItem.TargetPrice, trackedItem.IsActive },
                product = trackedItem.Product
            }));
        }).RequireAuthorization().RequireRateLimiting("track-url");
    }
}
