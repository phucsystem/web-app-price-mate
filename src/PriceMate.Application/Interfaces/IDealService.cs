using PriceMate.Application.DTOs.Common;
using PriceMate.Application.DTOs.Deals;

namespace PriceMate.Application.Interfaces;

public interface IDealService
{
    Task<PagedResponse<DealDto>> GetDealsAsync(CursorPaginationParams pagination, string? categorySlug, CancellationToken ct);
}
