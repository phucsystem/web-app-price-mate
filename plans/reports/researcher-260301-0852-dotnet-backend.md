# .NET 10 Backend Research Report — PriceMate AU

**Date:** 2026-03-01
**Project:** PriceMate AU (Amazon Price Tracker)
**Tech Stack:** .NET 10 Web API, PostgreSQL, Docker Compose, AWS CDK
**Scope:** Architecture, Auth, Database, Scheduled Jobs, Amazon API Integration

---

## 1. .NET 10 Web API Project Structure (Clean Architecture)

### Recommended Folder Layout

**Standard 4-layer clean architecture pattern confirmed as best practice for .NET 10:**

```
src/
├── PriceMate.API/                    # Presentation Layer
│   ├── Controllers/
│   ├── Endpoints/                    # Minimal APIs preferred in .NET 10
│   ├── Middleware/
│   ├── Program.cs
│   └── appsettings.json
├── PriceMate.Application/            # Application/Use Case Layer
│   ├── Commands/
│   ├── Queries/
│   ├── DTOs/
│   ├── Services/
│   └── Interfaces/
├── PriceMate.Domain/                 # Domain/Core Layer (Business Logic)
│   ├── Entities/
│   ├── ValueObjects/
│   ├── Enums/
│   └── Interfaces/
└── PriceMate.Infrastructure/         # Infrastructure Layer
    ├── Persistence/
    │   ├── Data/
    │   │   └── ApplicationDbContext.cs
    │   └── Migrations/
    ├── Services/
    ├── ExternalAPIs/
    └── BackgroundJobs/

tests/
├── PriceMate.Domain.Tests/
├── PriceMate.Application.Tests/
└── PriceMate.Infrastructure.Tests/
```

### Key Principles

- **Domain layer** (PriceMate.Domain): Zero external dependencies. Contains Entities, ValueObjects, Enums, and core interfaces. No references to DB, APIs, or frameworks.
- **Application layer** (PriceMate.Application): Use-case orchestration. DTOs, CQRS Commands/Queries, service interfaces (IRepository, ILogger, etc.). Depends on Domain only.
- **Infrastructure layer** (PriceMate.Infrastructure): All external implementations. DbContext, EF migrations, repository implementations, third-party service clients.
- **Presentation layer** (PriceMate.API): HTTP endpoints. Minimal APIs preferred over controllers in .NET 10 for cleaner code.

### .NET 10 Specifics

- **Minimal APIs** recommended over controller-based approach (simpler, more testable, aligns with microservices)
- **Native Dependency Injection** in Program.cs (no additional DI container needed)
- **IHostedService** built-in for background jobs (no external scheduler required for simple tasks)
- **EF Core 10.0** ships with modern features (JSON complex types, virtual columns, improved performance)

**Sources:**
- [Architecting Excellence: Clean Architecture with .NET Core 10](https://atalupadhyay.wordpress.com/2025/11/25/architecting-excellence-building-net-core-10-web-api-with-clean-architecture/)
- [Clean Architecture in .NET 10: Production Guide](https://dev.to/nikhilwagh/clean-architecture-in-net-10-patterns-that-actually-work-in-production-2025-guide-36b0)
- [Clean Architecture Reference Template](https://github.com/jasontaylordev/CleanArchitecture)

---

## 2. ASP.NET Core Identity + JWT Bearer Authentication

### Recommended Packages

| Package | Version | Purpose |
|---------|---------|---------|
| `Microsoft.AspNetCore.Authentication.JwtBearer` | Latest (.NET 10) | JWT validation middleware |
| `System.IdentityModel.Tokens.Jwt` | Latest | JWT token creation & parsing |
| `Microsoft.Extensions.Configuration` | Bundled | Config management (app settings) |

**Note:** ASP.NET Identity is optional. For API-only (no user management UI), use custom User entity + JWT tokens.

### Architecture Pattern: Access Token + Refresh Token

**Flow:**
```
User Login → Generate AccessToken (5-10 min) + RefreshToken (7-30 days)
    ↓
Client stores RefreshToken securely (database, cache, or secure cookie)
    ↓
AccessToken expires → Client calls /auth/refresh with RefreshToken
    ↓
API validates RefreshToken → Issues new AccessToken
```

### Implementation Pattern (Program.cs)

```csharp
// 1. Add JWT authentication scheme
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var key = Encoding.ASCII.GetBytes(config["Jwt:SecretKey"]);

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(key),
            ValidateIssuer = true,
            ValidIssuer = config["Jwt:Issuer"],
            ValidateAudience = true,
            ValidAudience = config["Jwt:Audience"],
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero  // Strict expiry
        };
    });

// 2. Add authorization
builder.Services.AddAuthorization();

// 3. Register custom auth service
builder.Services.AddScoped<IAuthService, AuthService>();

// 4. Apply middleware (order matters!)
app.UseAuthentication();
app.UseAuthorization();
```

### Critical Security Practices

- **Access tokens:** Short-lived (5-10 min), never stored in localStorage. Use in Authorization header.
- **Refresh tokens:** Long-lived (7-30 days), stored in httpOnly secure cookies or server-side cache. Not sent to UI.
- **Token validation:** Must validate signature, issuer, audience, expiration. API returns 401 (Unauthorized) if invalid.
- **Key rotation:** Use asymmetric keys (RSA) in production, not symmetric keys. Public key in well-known endpoints.
- **Refresh token storage:** Database or Redis. Implement token revocation (logout, password change, security breach).

### RefreshToken Entity Design

```csharp
public class RefreshToken
{
    public long Id { get; set; }
    public string Token { get; set; }           // Hashed token
    public long UserId { get; set; }
    public DateTime ExpiryDate { get; set; }
    public bool IsRevoked { get; set; }         // For logout
    public DateTime CreatedAt { get; set; }
}
```

**Sources:**
- [Microsoft Learn: JWT Bearer in ASP.NET Core 10](https://learn.microsoft.com/en-us/aspnet/core/security/authentication/configure-jwt-bearer-authentication?view=aspnetcore-10.0)
- [Refresh Tokens Implementation Guide](https://code-maze.com/using-refresh-tokens-in-asp-net-core-authentication/)

---

## 3. Entity Framework Core 10 + PostgreSQL (Npgsql)

### Package Requirements

| Package | Version | Notes |
|---------|---------|-------|
| `Microsoft.EntityFrameworkCore` | 10.0.x | Core EF |
| `Npgsql.EntityFrameworkCore.PostgreSQL` | 10.0.x | PostgreSQL provider |
| `Microsoft.EntityFrameworkCore.Design` | 10.0.x | CLI tools (migrations) |

**Latest Npgsql.EntityFrameworkCore.PostgreSQL:** 10.0.x (tracks EF Core 10.0)

### DbContext Setup (Program.cs)

```csharp
builder.Services.AddDbContextPool<ApplicationDbContext>(options =>
{
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        npgsqlOptions =>
        {
            npgsqlOptions.EnableRetryOnFailure(maxRetryCount: 3);
            npgsqlOptions.CommandTimeout(30);
        }
    );
});
```

**DbContextPool** recommended for ASP.NET Core (improves connection pooling performance).

### Entity Design for PriceMate AU

**Core Entities to Map:**

```csharp
// Domain layer
public class User
{
    public long Id { get; set; }
    public string Email { get; set; }
    public string PasswordHash { get; set; }
    public DateTime CreatedAt { get; set; }
    public ICollection<TrackedItem> TrackedItems { get; set; }
    public ICollection<Alert> Alerts { get; set; }
}

public class Product
{
    public long Id { get; set; }
    public string ASIN { get; set; }              // Amazon ASIN
    public string Title { get; set; }
    public string ImageUrl { get; set; }
    public long? CategoryId { get; set; }
    public DateTime CreatedAt { get; set; }
    public ICollection<PriceRecord> PriceHistory { get; set; }
}

public class Category
{
    public long Id { get; set; }
    public string Name { get; set; }
}

public class PriceRecord
{
    public long Id { get; set; }
    public long ProductId { get; set; }
    public decimal Price { get; set; }
    public DateTime RecordedAt { get; set; }     // When price was fetched
    public Product Product { get; set; }
}

public class TrackedItem
{
    public long Id { get; set; }
    public long UserId { get; set; }
    public long ProductId { get; set; }
    public decimal TargetPrice { get; set; }      // User sets alert threshold
    public DateTime AddedAt { get; set; }
    public User User { get; set; }
    public Product Product { get; set; }
    public ICollection<Alert> Alerts { get; set; }
}

public class Alert
{
    public long Id { get; set; }
    public long TrackedItemId { get; set; }
    public decimal PriceAtAlert { get; set; }
    public DateTime TriggeredAt { get; set; }
    public bool IsRead { get; set; }
    public TrackedItem TrackedItem { get; set; }
}

public class RefreshToken
{
    public long Id { get; set; }
    public long UserId { get; set; }
    public string Token { get; set; }             // Hashed
    public DateTime ExpiryDate { get; set; }
    public bool IsRevoked { get; set; }
    public DateTime CreatedAt { get; set; }
}
```

### Migrations Workflow

```bash
# Create migration
dotnet ef migrations add AddInitialSchema --project src/PriceMate.Infrastructure --startup-project src/PriceMate.API

# Apply migration (dev)
dotnet ef database update --project src/PriceMate.Infrastructure --startup-project src/PriceMate.API

# Generate SQL script (prod, for review before apply)
dotnet ef migrations script --project src/PriceMate.Infrastructure --startup-project src/PriceMate.API > migration.sql
```

### Npgsql-Specific Features (EF 10.0)

- **JSON Columns:** Map complex types directly to PostgreSQL JSON/JSONB. New in EF 10.
  ```csharp
  modelBuilder.Entity<Product>()
      .Property(p => p.Metadata)
      .HasConversion(
          v => JsonConvert.SerializeObject(v),
          v => JsonConvert.DeserializeObject<Dictionary<string, object>>(v)
      );
  ```
- **Array Types:** Store `List<string>` as PostgreSQL array directly.
  ```csharp
  modelBuilder.Entity<Product>()
      .Property(p => p.Tags)
      .HasConversion(v => string.Join(",", v), v => v.Split(",").ToList());
  ```
- **Virtual Generated Columns:** Supported in PostgreSQL 18+ (not needed for MVP).

### Connection String (appsettings.json)

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=pricemate_au;Username=pricemate;Password=secure_password"
  }
}
```

**Docker Compose:**
```yaml
services:
  postgres:
    image: postgres:17-alpine
    environment:
      POSTGRES_DB: pricemate_au
      POSTGRES_USER: pricemate
      POSTGRES_PASSWORD: secure_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### Gotchas & Tips

1. **Date storage:** Use `DateTime` (stores as `timestamp with timezone` in PostgreSQL). Avoid `DateTime.Now` in EF queries; use `DateTime.UtcNow`.
2. **Decimal precision:** Always specify `.HasPrecision(18, 2)` for money columns:
   ```csharp
   modelBuilder.Entity<PriceRecord>()
       .Property(p => p.Price)
       .HasPrecision(10, 2);  // $999,999.99 max
   ```
3. **Foreign key cascading:** Default is CASCADE on delete. Consider RESTRICT for User deletion (soft delete preferred).
4. **Indexes:** Add composite indexes for common queries (e.g., `(UserId, ProductId)` for TrackedItem lookups).

**Sources:**
- [Npgsql EF Core Provider Documentation](https://www.npgsql.org/efcore/)
- [ASP.NET Core 10 + PostgreSQL CRUD Tutorial](https://codewithmukesh.com/blog/aspnet-core-webapi-crud-with-entity-framework-core-full-course/)

---

## 4. BackgroundService for Price Fetching (4-6 Hour Schedule)

### Native .NET Approach (Built-In)

**Recommended:** Use `BackgroundService` + `PeriodicTimer` for simple 4-6 hour jobs. No external dependency needed.

### Implementation Pattern

```csharp
// Infrastructure/BackgroundJobs/PriceFetchingService.cs
public class PriceFetchingService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<PriceFetchingService> _logger;
    private PeriodicTimer _timer;
    private const int IntervalHours = 5;  // Run every 5 hours

    public PriceFetchingService(IServiceProvider serviceProvider,
                                ILogger<PriceFetchingService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _timer = new PeriodicTimer(TimeSpan.FromHours(IntervalHours));

        try
        {
            // Run immediately on startup, then repeat every N hours
            await DoWorkAsync(stoppingToken);

            while (await _timer.WaitForNextTickAsync(stoppingToken))
            {
                await DoWorkAsync(stoppingToken);
            }
        }
        catch (OperationCanceledException)
        {
            _logger.LogInformation("Price fetching service stopped.");
        }
        finally
        {
            _timer?.Dispose();
        }
    }

    private async Task DoWorkAsync(CancellationToken stoppingToken)
    {
        try
        {
            _logger.LogInformation("Starting price fetch cycle at {Time}", DateTime.UtcNow);

            // Create scope for DI
            using (var scope = _serviceProvider.CreateScope())
            {
                var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                var amazonService = scope.ServiceProvider.GetRequiredService<IAmazonProductService>();

                // Get all tracked items
                var trackedItems = await dbContext.TrackedItems
                    .Include(t => t.Product)
                    .Where(t => !t.Product.IsArchived)
                    .ToListAsync(stoppingToken);

                // Batch fetch (Amazon API has rate limits, fetch in groups of 10)
                foreach (var batch in trackedItems.Chunk(10))
                {
                    var asins = batch.Select(t => t.Product.ASIN).ToList();
                    var prices = await amazonService.GetPricesAsync(asins, stoppingToken);

                    foreach (var priceData in prices)
                    {
                        var product = batch.First(t => t.Product.ASIN == priceData.ASIN).Product;

                        // Record price
                        var record = new PriceRecord
                        {
                            ProductId = product.Id,
                            Price = priceData.CurrentPrice,
                            RecordedAt = DateTime.UtcNow
                        };
                        dbContext.PriceRecords.Add(record);

                        // Check for price drops (trigger alerts)
                        var trackedForProduct = batch
                            .Where(t => t.Product.Id == product.Id)
                            .ToList();

                        foreach (var tracked in trackedForProduct)
                        {
                            if (priceData.CurrentPrice <= tracked.TargetPrice && !tracked.HasActiveAlert)
                            {
                                var alert = new Alert
                                {
                                    TrackedItemId = tracked.Id,
                                    PriceAtAlert = priceData.CurrentPrice,
                                    TriggeredAt = DateTime.UtcNow,
                                    IsRead = false
                                };
                                dbContext.Alerts.Add(alert);
                                // TODO: Send email notification here
                            }
                        }
                    }

                    await dbContext.SaveChangesAsync(stoppingToken);
                }
            }

            _logger.LogInformation("Price fetch cycle completed at {Time}", DateTime.UtcNow);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during price fetching");
        }
    }

    public override async Task StopAsync(CancellationToken cancellationToken)
    {
        _timer?.Dispose();
        await base.StopAsync(cancellationToken);
    }
}

// Register in Program.cs
builder.Services.AddHostedService<PriceFetchingService>();
```

### Alternative: Hangfire for Complex Scenarios

If you need:
- Dashboard monitoring
- Retry logic with backoff
- Job persistence across restarts
- Distributed execution

Then add **Hangfire**:

```csharp
builder.Services.AddHangfire(config =>
    config.UsePostgreSqlStorage(builder.Configuration.GetConnectionString("DefaultConnection")));

// In background job
RecurringJob.AddOrUpdate<IPriceFetchingService>(
    "price-fetch",
    service => service.FetchPrices(JobCancellationToken.Null),
    Cron.Hours(5));  // Every 5 hours
```

**For MVP:** Use native `BackgroundService` + `PeriodicTimer` (simpler, no extra NuGet).

### Gotchas

1. **Timezone:** Always use `DateTime.UtcNow`, not `DateTime.Now`. Store in UTC, convert on display.
2. **Database transactions:** Create new `DbContext` per job (don't share). Use `CreateScope()`.
3. **Rate limiting:** Amazon API has QPS limits. Batch requests (max 10 per call), implement exponential backoff.
4. **Graceful shutdown:** Listen to `CancellationToken`. Don't forcefully kill tasks mid-execution.

**Sources:**
- [Efficient Background Jobs with .NET 8 Hosted Services](https://dev.to/leandroveiga/efficient-background-jobs-scheduled-tasks-in-net-8-with-hosted-services-50pk)
- [Hangfire Documentation](https://www.hangfire.io/)

---

## 5. Amazon Product Advertising API 5.0 (.NET Integration)

### Critical Alert: API Deprecation

**PA-API 5.0 will be deprecated on April 30th, 2026.** Amazon is requesting migration to the **Creators API**. Plan migration path if project timeline extends beyond April 2026.

### Current Status

- **No official C# .NET SDK.** Official SDKs only available for: PHP, Java, Node.js, Python.
- **Third-party .NET library:** [Nager.AmazonProductAdvertising](https://github.com/nager/Nager.AmazonProductAdvertising) (community-maintained, check GitHub for status).
- **Alternative:** Build HTTP client wrapper manually using `HttpClient` + request signing.

### Recommended Approach: Manual HTTP Client

Given deprecation timeline, recommend **lightweight HTTP client** rather than heavy SDK dependency:

```csharp
// Domain/Services/IAmazonProductService.cs
public interface IAmazonProductService
{
    Task<List<ProductPriceData>> GetPricesAsync(List<string> asins);
    Task<ProductDetails> GetProductDetailsAsync(string asin);
}

public class ProductPriceData
{
    public string ASIN { get; set; }
    public decimal CurrentPrice { get; set; }
    public decimal? LowestPrice { get; set; }
    public int AvailableCount { get; set; }
}

// Infrastructure/ExternalAPIs/AmazonProductService.cs
public class AmazonProductService : IAmazonProductService
{
    private readonly HttpClient _httpClient;
    private readonly string _accessKey;
    private readonly string _secretKey;
    private readonly string _partnerId;
    private const string AmazonEndpoint = "https://api.amazon.com.au/";  // AU marketplace

    public AmazonProductService(HttpClient httpClient, IConfiguration config)
    {
        _httpClient = httpClient;
        _accessKey = config["Amazon:AccessKey"];
        _secretKey = config["Amazon:SecretKey"];
        _partnerId = config["Amazon:PartnerId"];
    }

    public async Task<List<ProductPriceData>> GetPricesAsync(List<string> asins)
    {
        // Amazon PA-API 5.0 expects:
        // 1. Request body (JSON)
        // 2. AWS Signature Version 4 signing
        // 3. Host: webapi.amazon.com.au (for AU region)

        var payload = new
        {
            ItemIds = asins,
            Resources = new[]
            {
                "Offers.Summaries.LowestPrice",
                "Offers.Summaries.HighestSavingPercent"
            }
        };

        var request = new HttpRequestMessage(HttpMethod.Post, $"{AmazonEndpoint}paapi5/getitems");
        request.Content = new StringContent(
            JsonSerializer.Serialize(payload),
            Encoding.UTF8,
            "application/json"
        );

        // TODO: Implement AWS SigV4 signing here
        // Requires: AccessKey, SecretKey, timestamp, service name ("ProductAdvertisingAPI")
        SignRequest(request, payload);

        var response = await _httpClient.SendAsync(request);
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadAsStringAsync();
        var results = ParseAmazonResponse(json);

        return results;
    }

    private void SignRequest(HttpRequestMessage request, object payload)
    {
        // AWS Signature Version 4
        // 1. Create canonical request
        // 2. Create string to sign (includes timestamp)
        // 3. Calculate signature (HMAC-SHA256)
        // 4. Add Authorization header

        // Library option: Amazon.Extensions.CognitoAuthentication or AWS SDK v3
        // For this project, consider using AWS SDK's RequestSigner:
        // var signer = new Amazon.Runtime.SignatureV4Signer(AccessKey, SecretKey);
        // signer.Sign(request);

        throw new NotImplementedException("Implement AWS SigV4 signing");
    }

    private List<ProductPriceData> ParseAmazonResponse(string json)
    {
        // Deserialize JSON response from PA-API
        // Structure varies by resource requested
        // Handle rate limiting (429 response) + backoff

        throw new NotImplementedException("Parse Amazon response JSON");
    }
}
```

### AWS Signature V4 Signing

Use **AWS SDK for .NET** to handle signing instead of manual implementation:

```bash
dotnet add package AWSSDK.Core
dotnet add package AWSSDK.IdentityManagement
```

```csharp
// Use AWS SDK's request signer
var signer = new Amazon.Runtime.Internal.Auth.AWS4Signer();
// Configure credentials, sign request, attach headers
```

### Alternative: Third-Party Library

If manual signing too complex, try:
- **Nager.AmazonProductAdvertising** (GitHub): Check if maintained.
- **RestSharp + custom middleware:** Build signing middleware on top of RestSharp.

### Pagination & Rate Limiting

- **Rate limit:** 1 request/second per access key (stricter if high-volume).
- **Batch size:** Max 10 ASINs per request.
- **Backoff strategy:** Exponential backoff on 429 (Too Many Requests).

```csharp
public async Task<T> ExecuteWithRetryAsync<T>(
    Func<Task<T>> operation,
    int maxAttempts = 3,
    int initialDelayMs = 1000)
{
    int attempt = 0;
    while (attempt < maxAttempts)
    {
        try
        {
            return await operation();
        }
        catch (HttpRequestException ex) when (ex.StatusCode == System.Net.HttpStatusCode.TooManyRequests)
        {
            attempt++;
            int delayMs = initialDelayMs * (int)Math.Pow(2, attempt - 1);
            await Task.Delay(delayMs);
        }
    }
    throw new HttpRequestException("Max retries exceeded");
}
```

### Configuration (appsettings.json)

```json
{
  "Amazon": {
    "AccessKey": "YOUR_ACCESS_KEY",
    "SecretKey": "YOUR_SECRET_KEY",
    "PartnerId": "YOUR_PARTNER_ID",
    "Region": "au",
    "Host": "webapi.amazon.com.au"
  }
}
```

### Gotchas

1. **AU Marketplace:** Use `webapi.amazon.com.au` endpoint, not `.com`. Different API hosts for different regions.
2. **ASIN format:** Amazon uses 10-character alphanumeric ASINs. Validate format before sending.
3. **Price availability:** Not all products have pricing data (out of stock, region restrictions). Handle null values.
4. **Deprecation risk:** Migration plan required. Creators API contract TBD from Amazon. Start planning Q2 2026.

**Sources:**
- [Amazon Product Advertising API 5.0 Documentation](https://webservices.amazon.com/paapi5/documentation/)
- [Nager.AmazonProductAdvertising GitHub](https://github.com/nager/Nager.AmazonProductAdvertising)

---

## Unresolved Questions

1. **AWS SigV4 Signing Implementation:** Should we use AWS SDK or implement manually? AWS SDK cleaner but adds dependency.
2. **Creators API Migration Timeline:** When should we start? Amazon hasn't published full Creators API spec yet.
3. **Price Update Frequency:** Is 4-6 hours sufficient? Or more aggressive (hourly) needed for competitive tracking?
4. **Email Notifications:** Async queue (SQS/RabbitMQ) or synchronous during price fetch? Affects job design.
5. **Error Handling for Amazon API Failures:** Should we continue with stale prices or block price records? Affects data freshness guarantees.

---

## Next Steps

1. **Setup infrastructure:** Create project structure, register Program.cs dependencies
2. **Database:** Create EF Core DbContext, run initial migration
3. **Authentication:** Implement JWT + refresh token service
4. **Background job:** Build price fetcher with local testing
5. **Amazon API:** Prototype HTTP client, implement signing, test with real data
6. **Monitoring:** Add structured logging (Serilog) + Application Insights

