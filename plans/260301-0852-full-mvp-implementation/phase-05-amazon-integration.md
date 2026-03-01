# Phase 5: Amazon PA API Integration & Background Jobs

## Overview
- **Priority:** P1
- **Status:** completed
- **Effort:** 10h
- **Description:** PA API 5.0 HTTP client, background price fetcher, alert checker, SES email notifications

## Clean Architecture: Infrastructure Implements Application Interfaces

```
Application Layer (defines contracts)     Infrastructure Layer (implements)
─────────────────────────────────────     ──────────────────────────────────
IAmazonProductService                  →  AmazonProductService
  SearchItemsAsync(query)                   - HttpClient + SigV4 signing
  GetItemsByAsinAsync(asins)                - JSON parsing
                                            - Rate limiting + retry

IEmailService                          →  SesEmailService
  SendPriceAlertAsync(user, product)        - AWS SES SDK
  SendPasswordResetAsync(user, token)       - HTML email templates

IAlertCheckerService                   →  AlertCheckerService
  CheckAndTriggerAlertsAsync()              - Queries DB for price drops
                                            - Calls IEmailService

BackgroundService (registered in API)      PriceFetchingService
  ExecuteAsync()                            - PeriodicTimer (5hr)
                                            - Calls IAmazonProductService
                                            - Calls IAlertCheckerService
```

## CRITICAL: PA API Deprecation Notice

**PA-API 5.0 deprecated April 30, 2026.** Amazon migrating to Creators API.
- Design with `IAmazonProductService` abstraction
- Implementation is swappable without touching Application/Domain layers
- Monitor Amazon Creators API availability for migration in Phase 10+

## Key Insights
- No official .NET SDK for PA API 5.0; use manual HttpClient + AWS SigV4 signing
- AU marketplace endpoint: `webservices.amazon.com.au`
- Rate limit: ~1 req/sec per access key, max 10 ASINs per GetItems call
- Background job: PeriodicTimer (5hr), batch ASINs in groups of 10
- Alert check runs after each price fetch cycle
- SES requires verified sender domain/email in sandbox mode

## Related Code Files

### Application Layer (create)
| File | Action |
|------|--------|
| `src/PriceMate.Application/Interfaces/IAmazonProductService.cs` | create |
| `src/PriceMate.Application/Interfaces/IAlertCheckerService.cs` | create |
| `src/PriceMate.Application/DTOs/Amazon/AmazonSearchResult.cs` | create |
| `src/PriceMate.Application/DTOs/Amazon/AmazonProductData.cs` | create |

### Infrastructure Layer (create)
| File | Action |
|------|--------|
| `src/PriceMate.Infrastructure/ExternalApis/AmazonProductService.cs` | create |
| `src/PriceMate.Infrastructure/ExternalApis/AwsSigV4Signer.cs` | create |
| `src/PriceMate.Infrastructure/ExternalApis/AmazonApiConfig.cs` | create |
| `src/PriceMate.Infrastructure/Services/SesEmailService.cs` | create |
| `src/PriceMate.Infrastructure/Services/AlertCheckerService.cs` | create |
| `src/PriceMate.Infrastructure/BackgroundJobs/PriceFetchingService.cs` | create |
| `src/PriceMate.Infrastructure/BackgroundJobs/TokenCleanupService.cs` | create |

### API Layer (modify)
| File | Action |
|------|--------|
| `src/PriceMate.API/Program.cs` | modify — register hosted services + Amazon config |
| `src/PriceMate.API/appsettings.json` | modify — Amazon + SES config sections |

## Implementation Steps

### 1. NuGet Packages
```bash
dotnet add src/PriceMate.Infrastructure package AWSSDK.Core
dotnet add src/PriceMate.Infrastructure package AWSSDK.SimpleEmail
```

### 2. IAmazonProductService Interface (Application)
```csharp
public interface IAmazonProductService
{
    Task<List<AmazonSearchResult>> SearchItemsAsync(string query, int pageSize = 10, CancellationToken ct = default);
    Task<List<AmazonProductData>> GetItemsByAsinAsync(List<string> asins, CancellationToken ct = default);
}

public record AmazonSearchResult(string Asin, string Title, string ImageUrl, decimal? Price, string AmazonUrl, string? Category);
public record AmazonProductData(string Asin, decimal? CurrentPrice, string? Title, string? ImageUrl);
```

### 3. AWS SigV4 Signer
```csharp
public class AwsSigV4Signer
{
    // Implements AWS Signature Version 4 for PA API requests
    // Steps: canonical request → string to sign → signing key → authorization header
    // Service name: "ProductAdvertisingAPI"
    // Region: "us-west-2" (PA API uses us-west-2 even for AU)
    public void SignRequest(HttpRequestMessage request, string payload, string accessKey, string secretKey);
}
```

### 4. AmazonProductService Implementation
```csharp
public class AmazonProductService : IAmazonProductService
{
    private readonly HttpClient _httpClient;
    private readonly AwsSigV4Signer _signer;
    private readonly AmazonApiConfig _config;
    private readonly SemaphoreSlim _rateLimiter = new(1, 1); // 1 req at a time

    public async Task<List<AmazonSearchResult>> SearchItemsAsync(string query, ...)
    {
        var payload = new {
            Keywords = query,
            SearchIndex = "All",
            Resources = new[] {
                "Images.Primary.Large", "ItemInfo.Title",
                "Offers.Listings.Price", "BrowseNodeInfo.BrowseNodes"
            },
            PartnerTag = _config.PartnerId,
            PartnerType = "Associates",
            Marketplace = "www.amazon.com.au"
        };
        return await ExecuteWithRetryAsync(() => SendPaApiRequest<SearchResponse>("SearchItems", payload));
    }

    public async Task<List<AmazonProductData>> GetItemsByAsinAsync(List<string> asins, ...)
    {
        // Max 10 ASINs per request
        var payload = new {
            ItemIds = asins,
            Resources = new[] { "Offers.Listings.Price", "ItemInfo.Title", "Images.Primary.Large" },
            PartnerTag = _config.PartnerId,
            PartnerType = "Associates",
            Marketplace = "www.amazon.com.au"
        };
        return await ExecuteWithRetryAsync(() => SendPaApiRequest<GetItemsResponse>("GetItems", payload));
    }
}
```

### 5. Retry Logic with Exponential Backoff
```csharp
private async Task<T> ExecuteWithRetryAsync<T>(Func<Task<T>> operation, int maxAttempts = 3)
{
    for (int attempt = 1; attempt <= maxAttempts; attempt++)
    {
        try
        {
            await _rateLimiter.WaitAsync();
            try { return await operation(); }
            finally { _rateLimiter.Release(); await Task.Delay(1100); } // 1 req/sec
        }
        catch (HttpRequestException ex) when (ex.StatusCode == HttpStatusCode.TooManyRequests)
        {
            if (attempt == maxAttempts) throw;
            await Task.Delay(1000 * (int)Math.Pow(2, attempt));
        }
    }
    throw new InvalidOperationException("Max retries exceeded");
}
```

### 6. Background Price Fetching Service
```csharp
public class PriceFetchingService : BackgroundService
{
    private const int IntervalHours = 5;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var timer = new PeriodicTimer(TimeSpan.FromHours(IntervalHours));
        await FetchPricesAsync(stoppingToken); // Run immediately on startup
        while (await timer.WaitForNextTickAsync(stoppingToken))
            await FetchPricesAsync(stoppingToken);
    }

    private async Task FetchPricesAsync(CancellationToken ct)
    {
        using var scope = _serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var amazonService = scope.ServiceProvider.GetRequiredService<IAmazonProductService>();
        var alertChecker = scope.ServiceProvider.GetRequiredService<IAlertCheckerService>();

        // 1. Get distinct products from active tracked items
        var products = await dbContext.Products
            .Where(p => p.TrackedItems.Any(ti => ti.IsActive))
            .OrderBy(p => p.LastFetchedAt) // Oldest first
            .ToListAsync(ct);

        // 2. Batch fetch in groups of 10
        foreach (var batch in products.Chunk(10))
        {
            var asins = batch.Select(p => p.Asin).ToList();
            var priceData = await amazonService.GetItemsByAsinAsync(asins, ct);

            foreach (var data in priceData)
            {
                var product = batch.First(p => p.Asin == data.Asin);
                if (data.CurrentPrice == null) continue;

                // Record new price
                dbContext.PriceRecords.Add(new PriceRecord {
                    ProductId = product.Id, Price = data.CurrentPrice.Value,
                    RecordedAt = DateTime.UtcNow
                });

                // Update product stats
                product.CurrentPrice = data.CurrentPrice.Value;
                product.LastFetchedAt = DateTime.UtcNow;
                if (product.LowestPrice == null || data.CurrentPrice < product.LowestPrice)
                    product.LowestPrice = data.CurrentPrice;
                if (product.HighestPrice == null || data.CurrentPrice > product.HighestPrice)
                    product.HighestPrice = data.CurrentPrice;
            }
            await dbContext.SaveChangesAsync(ct);
        }

        // 3. Check alerts after all prices updated
        await alertChecker.CheckAndTriggerAlertsAsync(ct);
    }
}
```

### 7. Alert Checker Service
```csharp
public class AlertCheckerService : IAlertCheckerService
{
    public async Task CheckAndTriggerAlertsAsync(CancellationToken ct)
    {
        // Find tracked items where: is_active, target_price IS NOT NULL,
        // current_price <= target_price, no alert sent in last 24h for same item
        var eligibleItems = await _context.TrackedItems
            .Include(ti => ti.Product).Include(ti => ti.User)
            .Where(ti => ti.IsActive && ti.TargetPrice != null
                && ti.Product.CurrentPrice <= ti.TargetPrice
                && !ti.Alerts.Any(a => a.SentAt > DateTime.UtcNow.AddHours(-24)))
            .ToListAsync(ct);

        foreach (var item in eligibleItems)
        {
            // Create alert record
            _context.Alerts.Add(new Alert {
                TrackedItemId = item.Id, Type = AlertType.PriceDrop,
                PriceAtAlert = item.Product.CurrentPrice!.Value, SentAt = DateTime.UtcNow
            });
            // Send email
            await _emailService.SendPriceAlertAsync(item.User, item.Product, item.TargetPrice!.Value);
        }
        await _context.SaveChangesAsync(ct);
    }
}
```

### 8. SES Email Service
```csharp
public class SesEmailService : IEmailService
{
    private readonly IAmazonSimpleEmailService _sesClient;

    public async Task SendPriceAlertAsync(User user, Product product, decimal targetPrice)
    {
        var subject = $"Price Drop Alert: {product.Title}";
        var body = $"The price of {product.Title} dropped to ${product.CurrentPrice} " +
                   $"(your target: ${targetPrice}). View on Amazon: {product.AmazonUrl}";
        await SendEmailAsync(user.Email, subject, body);
    }

    public async Task SendPasswordResetAsync(User user, string resetToken)
    {
        var resetUrl = $"{_config.FrontendBaseUrl}/reset-password?token={resetToken}";
        await SendEmailAsync(user.Email, "Reset Your PriceMate Password",
            $"Click to reset: {resetUrl}. Link expires in 1 hour.");
    }
}
```

### 9. Token Cleanup Background Job
```csharp
public class TokenCleanupService : BackgroundService
{
    // Runs daily, deletes expired refresh tokens
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var timer = new PeriodicTimer(TimeSpan.FromHours(24));
        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            using var scope = _serviceProvider.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            await db.RefreshTokens.Where(rt => rt.ExpiresAt < DateTime.UtcNow)
                .ExecuteDeleteAsync(stoppingToken);
        }
    }
}
```

### 10. Configuration
```json
{
  "Amazon": {
    "AccessKey": "",
    "SecretKey": "",
    "PartnerId": "pricemate-au-20",
    "Host": "webservices.amazon.com.au",
    "Region": "us-west-2"
  },
  "Ses": {
    "SenderEmail": "alerts@pricemate.com.au",
    "Region": "ap-southeast-2"
  }
}
```

### 11. DI Registration
```csharp
builder.Services.AddHttpClient<IAmazonProductService, AmazonProductService>();
builder.Services.AddScoped<IAlertCheckerService, AlertCheckerService>();
builder.Services.AddScoped<IEmailService, SesEmailService>();
builder.Services.AddHostedService<PriceFetchingService>();
builder.Services.AddHostedService<TokenCleanupService>();
```

## Todo List
- [x] IAmazonProductService + DTOs in Application
- [x] AwsSigV4Signer utility
- [x] AmazonProductService with SearchItems + GetItems
- [x] Rate limiter (1 req/sec) + exponential backoff retry
- [x] PriceFetchingService (PeriodicTimer, 5hr, batch of 10)
- [x] IAlertCheckerService + AlertCheckerService
- [x] SesEmailService with price alert + password reset templates
- [x] TokenCleanupService (daily expired token cleanup)
- [x] Amazon + SES config in appsettings
- [x] DI registrations for all services + hosted services

## Success Criteria
- PA API SearchItems returns product results for AU marketplace
- GetItems returns current prices for batch of ASINs
- Background service runs on startup, then every 5 hours
- Price records created in DB after fetch cycle
- Product stats (lowest, highest, current) updated after fetch
- Alerts triggered when current_price <= target_price
- Email sent via SES for price drop alerts
- Expired refresh tokens cleaned up daily
- Service handles PA API rate limits gracefully (no 429 errors propagated)

## Risk Assessment
| Risk | Impact | Mitigation |
|------|--------|------------|
| PA API deprecation April 2026 | Critical | IAmazonProductService abstraction; monitor Creators API |
| SigV4 signing complexity | High | Use AWSSDK.Core helpers; test with real credentials early |
| SES sandbox limits | Medium | Request production access; use verified emails for dev |
| Background service crash | Medium | try/catch around entire cycle; log errors; continue on next tick |
