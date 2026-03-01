namespace PriceMate.Application.DTOs.Amazon;

public record AmazonSearchResult(
    string Asin,
    string Title,
    string? ImageUrl,
    decimal? Price,
    string AmazonUrl,
    string? Category
);
