using PriceMate.Application.DTOs.Common;
using PriceMate.Application.DTOs.Dashboard;
using PriceMate.Application.DTOs.Products;

namespace PriceMate.Application.Interfaces;

public interface IProductService
{
    Task<PagedResponse<ProductDto>> SearchAsync(string query, CursorPaginationParams pagination, CancellationToken ct);
    Task<ProductDetailDto> GetByAsinAsync(string asin, Guid? userId, CancellationToken ct);
    Task<List<PriceRecordDto>> GetPriceHistoryAsync(string asin, string range, CancellationToken ct);
    Task<TrackedItemDto> TrackByUrlAsync(Guid userId, TrackUrlRequest request, CancellationToken ct);
}
