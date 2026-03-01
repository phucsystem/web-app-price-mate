using PriceMate.Application.DTOs.Categories;
using PriceMate.Application.DTOs.Common;
using PriceMate.Application.DTOs.Products;
using PriceMate.Application.Interfaces;

namespace PriceMate.API.Endpoints;

public static class CategoryEndpoints
{
    public static void MapCategoryEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/categories").RequireRateLimiting("general");

        group.MapGet("/", async (ICategoryService categoryService, CancellationToken ct) =>
        {
            var categories = await categoryService.GetAllAsync(ct);
            return Results.Ok(new ApiResponse<List<CategoryDto>>(categories));
        });

        group.MapGet("/{slug}", async (
            string slug,
            Guid? cursor,
            int limit,
            string? sort,
            ICategoryService categoryService,
            CancellationToken ct) =>
        {
            var pagination = new CursorPaginationParams(cursor, limit == 0 ? 20 : limit, sort ?? "date_added");
            var (category, products) = await categoryService.GetProductsByCategoryAsync(slug, pagination, ct);
            var meta = new PaginationMeta(products.NextCursor, products.HasMore);

            return Results.Ok(new ApiResponse<CategoryProductsResponse>(
                new CategoryProductsResponse(category, products.Items), meta));
        });
    }
}
