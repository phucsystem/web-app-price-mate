using Microsoft.EntityFrameworkCore;
using PriceMate.Application.DTOs.Categories;
using PriceMate.Application.DTOs.Common;
using PriceMate.Application.DTOs.Products;
using PriceMate.Application.Helpers;
using PriceMate.Application.Interfaces;

namespace PriceMate.Application.Services;

public class CategoryService(IApplicationDbContext dbContext) : ICategoryService
{
    public async Task<List<CategoryDto>> GetAllAsync(CancellationToken ct)
    {
        return await dbContext.Categories
            .OrderBy(c => c.Name)
            .Select(c => new CategoryDto(c.Id, c.Name, c.Slug, c.ProductCount))
            .ToListAsync(ct);
    }

    public async Task<(CategoryDto Category, PagedResponse<ProductDto> Products)> GetProductsByCategoryAsync(
        string slug, CursorPaginationParams pagination, CancellationToken ct)
    {
        var category = await dbContext.Categories
            .FirstOrDefaultAsync(c => c.Slug == slug, ct)
            ?? throw new KeyNotFoundException($"Category '{slug}' not found.");

        var limit = pagination.ClampedLimit;
        var query = dbContext.Products
            .Include(p => p.Category)
            .Where(p => p.CategoryId == category.Id);

        if (pagination.Cursor.HasValue)
            query = query.Where(p => p.Id.CompareTo(pagination.Cursor.Value) > 0);

        query = pagination.Sort switch
        {
            "price_asc" => query.OrderBy(p => p.CurrentPrice),
            "price_desc" => query.OrderByDescending(p => p.CurrentPrice),
            "price_drop" => query.OrderByDescending(p => p.HighestPrice - p.CurrentPrice),
            _ => query.OrderBy(p => p.Id)
        };

        var items = await query.Take(limit + 1).ToListAsync(ct);
        var hasMore = items.Count > limit;
        if (hasMore) items.RemoveAt(items.Count - 1);

        var dtos = items.Select(p => new ProductDto(
            p.Asin, p.Title, p.ImageUrl, p.CurrentPrice, p.AmazonUrl,
            DealScoreCalculator.Calculate(p.CurrentPrice, p.LowestPrice, p.HighestPrice),
            p.Category?.Name
        )).ToList();

        var nextCursor = hasMore ? items.Last().Id.ToString() : null;
        var categoryDto = new CategoryDto(category.Id, category.Name, category.Slug, category.ProductCount);

        return (categoryDto, new PagedResponse<ProductDto>(dtos, nextCursor, hasMore));
    }
}
