using System.Security.Claims;
using PriceMate.Application.DTOs.Common;
using PriceMate.Application.DTOs.Dashboard;
using PriceMate.Application.Interfaces;

namespace PriceMate.API.Endpoints;

public static class TrackedItemEndpoints
{
    public static void MapTrackedItemEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/tracked-items").RequireAuthorization().RequireRateLimiting("general");

        group.MapPost("/{id:guid}/alert", async (
            Guid id,
            AlertRequest request,
            HttpContext httpContext,
            ITrackedItemService trackedItemService,
            CancellationToken ct) =>
        {
            var userId = GetUserId(httpContext);
            if (userId is null) return Results.Unauthorized();

            var result = await trackedItemService.SetAlertAsync(userId.Value, id, request.TargetPrice, ct);
            return Results.Ok(new ApiResponse<TrackedItemSummaryDto>(result));
        });

        group.MapPut("/{id:guid}/alert", async (
            Guid id,
            AlertRequest request,
            HttpContext httpContext,
            ITrackedItemService trackedItemService,
            CancellationToken ct) =>
        {
            var userId = GetUserId(httpContext);
            if (userId is null) return Results.Unauthorized();

            var result = await trackedItemService.UpdateAlertAsync(userId.Value, id, request.TargetPrice, ct);
            return Results.Ok(new ApiResponse<TrackedItemSummaryDto>(result));
        });

        group.MapDelete("/{id:guid}", async (
            Guid id,
            HttpContext httpContext,
            ITrackedItemService trackedItemService,
            CancellationToken ct) =>
        {
            var userId = GetUserId(httpContext);
            if (userId is null) return Results.Unauthorized();

            await trackedItemService.RemoveAsync(userId.Value, id, ct);
            return Results.NoContent();
        });

        group.MapGet("/export", async (
            HttpContext httpContext,
            ITrackedItemService trackedItemService,
            CancellationToken ct) =>
        {
            var userId = GetUserId(httpContext);
            if (userId is null) return Results.Unauthorized();

            var csvBytes = await trackedItemService.ExportCsvAsync(userId.Value, ct);
            return Results.File(csvBytes, "text/csv", "tracked-items.csv");
        });
    }

    private static Guid? GetUserId(HttpContext httpContext)
    {
        var claim = httpContext.User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? httpContext.User.FindFirstValue("sub");
        return Guid.TryParse(claim, out var userId) ? userId : null;
    }
}

public record AlertRequest(decimal TargetPrice);
