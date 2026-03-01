using PriceMate.Application.DTOs.Amazon;

namespace PriceMate.Application.Interfaces;

public interface IAmazonProductService
{
    Task<List<AmazonSearchResult>> SearchItemsAsync(string query, int pageSize = 10, CancellationToken ct = default);
    Task<List<AmazonProductData>> GetItemsByAsinAsync(List<string> asins, CancellationToken ct = default);
}
