using PriceMate.Application.DTOs.Dashboard;

namespace PriceMate.Application.DTOs.Products;

public record ProductCategoryDto(string Name, string Slug);

public record ProductDetailDto(
    string Asin,
    string Title,
    string? ImageUrl,
    string AmazonUrl,
    decimal CurrentPrice,
    decimal LowestPrice,
    decimal HighestPrice,
    decimal AveragePrice,
    string? DealScore,
    ProductCategoryDto? Category,
    DateTime? LastFetchedAt,
    TrackedItemSummaryDto? TrackedItem
);
