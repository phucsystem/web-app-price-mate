namespace PriceMate.Application.DTOs.Common;

public record ApiResponse<T>(T Data, PaginationMeta? Meta = null);

public record ApiErrorResponse(ApiError Error);

public record ApiError(string Code, string Message, List<string>? Details = null);

public record PaginationMeta(string? Cursor, bool HasMore, int? TotalEstimate = null);
