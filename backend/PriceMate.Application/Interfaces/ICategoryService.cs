using PriceMate.Application.DTOs.Categories;
using PriceMate.Application.DTOs.Common;
using PriceMate.Application.DTOs.Products;

namespace PriceMate.Application.Interfaces;

public interface ICategoryService
{
    Task<List<CategoryDto>> GetAllAsync(CancellationToken ct);
    Task<(CategoryDto Category, PagedResponse<ProductDto> Products)> GetProductsByCategoryAsync(
        string slug, CursorPaginationParams pagination, CancellationToken ct);
}
