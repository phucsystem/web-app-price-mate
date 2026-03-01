using PriceMate.Application.DTOs.Dashboard;

namespace PriceMate.Application.DTOs.Deals;

public record DealDto(
    string Asin,
    string Title,
    string? ImageUrl,
    decimal CurrentPrice,
    decimal? PreviousPrice,
    PriceChangeDto? PriceChange,
    string? DealScore,
    string AmazonUrl,
    string? Category
);
