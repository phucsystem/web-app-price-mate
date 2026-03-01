namespace PriceMate.Application.DTOs.Common;

public record PagedResponse<T>(List<T> Items, string? NextCursor, bool HasMore, int? TotalEstimate = null);
