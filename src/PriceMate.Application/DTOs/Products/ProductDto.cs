namespace PriceMate.Application.DTOs.Products;

public record ProductDto(
    string Asin,
    string Title,
    string? ImageUrl,
    decimal CurrentPrice,
    string AmazonUrl,
    string? DealScore,
    string? Category
);
