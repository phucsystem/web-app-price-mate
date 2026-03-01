namespace PriceMate.Application.DTOs.Amazon;

public record AmazonProductData(
    string Asin,
    decimal? CurrentPrice,
    string? Title,
    string? ImageUrl
);
