using PriceMate.Application.DTOs.Products;

namespace PriceMate.Application.DTOs.Categories;

public record CategoryDto(Guid Id, string Name, string Slug, int ProductCount);

public record CategoryProductsResponse(CategoryDto Category, List<ProductDto> Products);
