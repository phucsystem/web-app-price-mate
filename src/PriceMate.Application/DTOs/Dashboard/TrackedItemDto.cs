namespace PriceMate.Application.DTOs.Dashboard;

public record TrackedItemSummaryDto(Guid Id, decimal? TargetPrice, bool IsActive);

public record ProductSummaryDto(string Asin, string Title, string? ImageUrl, decimal CurrentPrice);

public record PriceChangeDto(decimal Amount, decimal Percentage);

public record TrackedItemDto(
    Guid TrackedItemId,
    ProductSummaryDto Product,
    decimal? TargetPrice,
    bool IsActive,
    PriceChangeDto? PriceChange,
    string? DealScore,
    List<decimal> Sparkline,
    DateTime CreatedAt
);
