using System.Net;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;
using PriceMate.Application.DTOs.Amazon;
using PriceMate.Application.Interfaces;

namespace PriceMate.Infrastructure.ExternalApis;

public class AmazonProductService(
    HttpClient httpClient,
    AwsSigV4Signer signer,
    AmazonApiConfig config,
    ILogger<AmazonProductService> logger) : IAmazonProductService
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };
    private readonly SemaphoreSlim _rateLimiter = new(1, 1);

    public async Task<List<AmazonSearchResult>> SearchItemsAsync(string query, int pageSize = 10, CancellationToken ct = default)
    {
        var payload = new
        {
            Keywords = query,
            SearchIndex = "All",
            ItemCount = pageSize,
            Resources = new[] {
                "Images.Primary.Large", "ItemInfo.Title",
                "Offers.Listings.Price", "BrowseNodeInfo.BrowseNodes"
            },
            PartnerTag = config.PartnerId,
            PartnerType = "Associates",
            Marketplace = "www.amazon.com.au"
        };

        var response = await ExecuteWithRetryAsync(() =>
            SendPaApiRequestAsync<PaSearchResponse>("searchitems", payload, ct), ct);

        return response?.SearchResult?.Items?
            .Select(MapToSearchResult)
            .ToList() ?? [];
    }

    public async Task<List<AmazonProductData>> GetItemsByAsinAsync(List<string> asins, CancellationToken ct = default)
    {
        var payload = new
        {
            ItemIds = asins,
            Resources = new[] { "Offers.Listings.Price", "ItemInfo.Title", "Images.Primary.Large" },
            PartnerTag = config.PartnerId,
            PartnerType = "Associates",
            Marketplace = "www.amazon.com.au"
        };

        var response = await ExecuteWithRetryAsync(() =>
            SendPaApiRequestAsync<PaGetItemsResponse>("getitems", payload, ct), ct);

        return response?.ItemsResult?.Items?
            .Select(MapToProductData)
            .ToList() ?? [];
    }

    private async Task<T?> SendPaApiRequestAsync<T>(string operation, object payload, CancellationToken ct)
    {
        var json = JsonSerializer.Serialize(payload);
        var url = $"https://{config.Host}/paapi5/{operation}";
        var request = new HttpRequestMessage(HttpMethod.Post, url)
        {
            Content = new StringContent(json, Encoding.UTF8, "application/json")
        };

        signer.SignRequest(request, json, config);

        var response = await httpClient.SendAsync(request, ct);
        response.EnsureSuccessStatusCode();

        var body = await response.Content.ReadAsStringAsync(ct);
        return JsonSerializer.Deserialize<T>(body, JsonOptions);
    }

    private async Task<T?> ExecuteWithRetryAsync<T>(Func<Task<T?>> operation, CancellationToken ct, int maxAttempts = 3)
    {
        for (var attempt = 1; attempt <= maxAttempts; attempt++)
        {
            await _rateLimiter.WaitAsync(ct);
            try
            {
                var result = await operation();
                await Task.Delay(1100, ct);
                return result;
            }
            catch (HttpRequestException ex) when (ex.StatusCode == HttpStatusCode.TooManyRequests)
            {
                _rateLimiter.Release();
                if (attempt == maxAttempts) throw;
                var delay = 1000 * (int)Math.Pow(2, attempt);
                logger.LogWarning("PA API rate limited. Retrying in {Delay}ms (attempt {Attempt}/{Max})", delay, attempt, maxAttempts);
                await Task.Delay(delay, ct);
                continue;
            }
            catch
            {
                _rateLimiter.Release();
                throw;
            }
            finally
            {
                if (_rateLimiter.CurrentCount == 0)
                    _rateLimiter.Release();
            }
        }
        throw new InvalidOperationException("Max retries exceeded");
    }

    private static AmazonSearchResult MapToSearchResult(PaItem item) => new(
        item.ASIN ?? string.Empty,
        item.ItemInfo?.Title?.DisplayValue ?? string.Empty,
        item.Images?.Primary?.Large?.URL,
        ExtractPrice(item),
        $"https://www.amazon.com.au/dp/{item.ASIN}",
        item.BrowseNodeInfo?.BrowseNodes?.FirstOrDefault()?.DisplayName
    );

    private static AmazonProductData MapToProductData(PaItem item) => new(
        item.ASIN ?? string.Empty,
        ExtractPrice(item),
        item.ItemInfo?.Title?.DisplayValue,
        item.Images?.Primary?.Large?.URL
    );

    private static decimal? ExtractPrice(PaItem item)
    {
        var amount = item.Offers?.Listings?.FirstOrDefault()?.Price?.Amount;
        return amount.HasValue ? (decimal)amount.Value : null;
    }

    // PA API response models
    private sealed class PaSearchResponse
    {
        public PaSearchResult? SearchResult { get; set; }
    }

    private sealed class PaSearchResult
    {
        public List<PaItem>? Items { get; set; }
    }

    private sealed class PaGetItemsResponse
    {
        public PaItemsResult? ItemsResult { get; set; }
    }

    private sealed class PaItemsResult
    {
        public List<PaItem>? Items { get; set; }
    }

    private sealed class PaItem
    {
        [JsonPropertyName("ASIN")]
        public string? ASIN { get; set; }
        public PaItemInfo? ItemInfo { get; set; }
        public PaImages? Images { get; set; }
        public PaOffers? Offers { get; set; }
        public PaBrowseNodeInfo? BrowseNodeInfo { get; set; }
    }

    private sealed class PaItemInfo
    {
        public PaDisplayValue? Title { get; set; }
    }

    private sealed class PaDisplayValue
    {
        public string? DisplayValue { get; set; }
    }

    private sealed class PaImages
    {
        public PaImageSet? Primary { get; set; }
    }

    private sealed class PaImageSet
    {
        public PaImage? Large { get; set; }
    }

    private sealed class PaImage
    {
        [JsonPropertyName("URL")]
        public string? URL { get; set; }
    }

    private sealed class PaOffers
    {
        public List<PaListing>? Listings { get; set; }
    }

    private sealed class PaListing
    {
        public PaPrice? Price { get; set; }
    }

    private sealed class PaPrice
    {
        public double? Amount { get; set; }
    }

    private sealed class PaBrowseNodeInfo
    {
        public List<PaBrowseNode>? BrowseNodes { get; set; }
    }

    private sealed class PaBrowseNode
    {
        public string? DisplayName { get; set; }
    }
}
