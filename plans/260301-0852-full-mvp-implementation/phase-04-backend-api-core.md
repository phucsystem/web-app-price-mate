# Phase 4: Backend API — Products, Dashboard, Deals, Categories

## Overview
- **Priority:** P1
- **Status:** completed
- **Effort:** 12h
- **Description:** All non-auth API endpoints. Service interfaces in Application, implementations split between Application (orchestration) and Infrastructure (data access).

## Clean Architecture: API Layer Only Maps HTTP to Application

```
GET /api/products/search?q=sony
    │
    ▼ (API Layer — just maps HTTP params to Application call)
ProductEndpoints.Search(query, cursor, limit)
    │
    ▼ (Application Layer — orchestration + business logic)
IProductService.SearchAsync(query, cursor, limit)
    │
    ▼ (Infrastructure — calls PA API or DB)
IAmazonProductService.SearchItemsAsync(query)
IRepository<Product>.GetByAsinAsync(asin)
```

The API layer NEVER contains business logic. No if/else on deal scores, no price calculations, no pagination logic — all in Application.

## Key Insights
- API_SPEC defines 12 non-auth endpoints across 4 groups
- Cursor-based pagination: use UUID of last item, default limit 20, max 50
- Deal score algorithm: `position = (highest - current) / range` → great(>=0.7)/good(>=0.4)/average(>=0.1)/null
- Dashboard returns summary (totalTracked, activeAlerts, recentDrops) + paginated items with sparklines
- CSV export returns `text/csv` content type
- All list responses use common `ApiResponse<T>` wrapper with `data` + `meta`

## Related Code Files

### Application Layer (create)
| File | Action |
|------|--------|
| `src/PriceMate.Application/Interfaces/IProductService.cs` | create |
| `src/PriceMate.Application/Interfaces/IDashboardService.cs` | create |
| `src/PriceMate.Application/Interfaces/ICategoryService.cs` | create |
| `src/PriceMate.Application/Interfaces/IDealService.cs` | create |
| `src/PriceMate.Application/Interfaces/ITrackedItemService.cs` | create |
| `src/PriceMate.Application/Interfaces/IAmazonProductService.cs` | create |
| `src/PriceMate.Application/DTOs/Products/ProductDto.cs` | create |
| `src/PriceMate.Application/DTOs/Products/ProductDetailDto.cs` | create |
| `src/PriceMate.Application/DTOs/Products/PriceRecordDto.cs` | create |
| `src/PriceMate.Application/DTOs/Products/TrackUrlRequest.cs` | create |
| `src/PriceMate.Application/DTOs/Dashboard/DashboardResponse.cs` | create |
| `src/PriceMate.Application/DTOs/Dashboard/TrackedItemDto.cs` | create |
| `src/PriceMate.Application/DTOs/Categories/CategoryDto.cs` | create |
| `src/PriceMate.Application/DTOs/Deals/DealDto.cs` | create |
| `src/PriceMate.Application/DTOs/Common/PagedResponse.cs` | create |
| `src/PriceMate.Application/DTOs/Common/ApiResponse.cs` | create |
| `src/PriceMate.Application/DTOs/Common/CursorPaginationParams.cs` | create |
| `src/PriceMate.Application/Services/ProductService.cs` | create |
| `src/PriceMate.Application/Services/DashboardService.cs` | create |
| `src/PriceMate.Application/Services/CategoryService.cs` | create |
| `src/PriceMate.Application/Services/DealService.cs` | create |
| `src/PriceMate.Application/Services/TrackedItemService.cs` | create |
| `src/PriceMate.Application/Helpers/DealScoreCalculator.cs` | create |

### API Layer (create)
| File | Action |
|------|--------|
| `src/PriceMate.API/Endpoints/ProductEndpoints.cs` | create |
| `src/PriceMate.API/Endpoints/DashboardEndpoints.cs` | create |
| `src/PriceMate.API/Endpoints/TrackedItemEndpoints.cs` | create |
| `src/PriceMate.API/Endpoints/CategoryEndpoints.cs` | create |
| `src/PriceMate.API/Endpoints/DealEndpoints.cs` | create |
| `src/PriceMate.API/Middleware/GlobalExceptionHandler.cs` | create |

### API Layer (modify)
| File | Action |
|------|--------|
| `src/PriceMate.API/Program.cs` | modify — register services, map endpoints, add rate limiters |

## Implementation Steps

### 1. Common DTOs
```csharp
// Standardized API response wrapper
public record ApiResponse<T>(T Data, PaginationMeta? Meta = null);
public record ApiErrorResponse(ApiError Error);
public record ApiError(string Code, string Message, List<string>? Details = null);
public record PaginationMeta(string? Cursor, bool HasMore, int? TotalEstimate = null);
public record CursorPaginationParams(Guid? Cursor = null, int Limit = 20, string Sort = "date_added");
```

### 2. Product Service Interface + Implementation
```csharp
public interface IProductService
{
    Task<PagedResponse<ProductDto>> SearchAsync(string query, CursorPaginationParams pagination, CancellationToken ct);
    Task<ProductDetailDto> GetByAsinAsync(string asin, Guid? userId, CancellationToken ct);
    Task<List<PriceRecordDto>> GetPriceHistoryAsync(string asin, string range, CancellationToken ct);
    Task<TrackedItemDto> TrackByUrlAsync(Guid userId, TrackUrlRequest request, CancellationToken ct);
}
```
- `Search`: Call IAmazonProductService.SearchItems → map to DTOs → calculate deal scores
- `GetByAsin`: Load from DB with includes → attach trackedItem if userId provided
- `GetPriceHistory`: Filter by range (30d/90d/180d/1y/all), order by recordedAt DESC
- `TrackByUrl`: Parse ASIN from URL → fetch from PA API if new → create Product + TrackedItem

### 3. Deal Score Calculator (Application helper)
```csharp
public static class DealScoreCalculator
{
    public static string? Calculate(decimal? current, decimal? lowest, decimal? highest)
    {
        if (current == null || lowest == null || highest == null) return null;
        var range = highest.Value - lowest.Value;
        if (range <= 0) return null;
        var position = (highest.Value - current.Value) / range;
        return position switch
        {
            >= 0.7m => "great",
            >= 0.4m => "good",
            >= 0.1m => "average",
            _ => null
        };
    }
}
```

### 4. Dashboard Service
```csharp
public interface IDashboardService
{
    Task<DashboardResponse> GetDashboardAsync(Guid userId, CursorPaginationParams pagination, CancellationToken ct);
}
```
- Returns summary: count tracked items, count active alerts, count items with drops in last 7 days
- Returns paginated tracked items with: product info, price change (current vs previous), sparkline (last 5 prices), deal score
- Sort options: price_drop, date_added, name

### 5. Tracked Item Service
```csharp
public interface ITrackedItemService
{
    Task SetAlertAsync(Guid userId, Guid trackedItemId, decimal targetPrice, CancellationToken ct);
    Task UpdateAlertAsync(Guid userId, Guid trackedItemId, decimal targetPrice, CancellationToken ct);
    Task RemoveAsync(Guid userId, Guid trackedItemId, CancellationToken ct);
    Task<byte[]> ExportCsvAsync(Guid userId, CancellationToken ct);
}
```

### 6. Category & Deal Services
```csharp
public interface ICategoryService
{
    Task<List<CategoryDto>> GetAllAsync(CancellationToken ct);
    Task<PagedResponse<ProductDto>> GetProductsByCategoryAsync(string slug, CursorPaginationParams pagination, CancellationToken ct);
}

public interface IDealService
{
    Task<PagedResponse<DealDto>> GetDealsAsync(CursorPaginationParams pagination, string? categorySlug, CancellationToken ct);
}
```

### 7. Cursor Pagination Implementation Pattern
```csharp
// In repository/service:
var query = _context.Products.AsQueryable();
if (cursor != null)
    query = query.Where(p => p.Id.CompareTo(cursor.Value) > 0);
var items = await query.OrderBy(p => p.Id).Take(limit + 1).ToListAsync(ct);
var hasMore = items.Count > limit;
if (hasMore) items.RemoveAt(items.Count - 1);
var nextCursor = hasMore ? items.Last().Id.ToString() : null;
```

### 8. API Endpoints (Minimal API groups)
```csharp
// ProductEndpoints
app.MapGroup("/api/products")
    .MapGet("/search", SearchProducts)           // ?q=&cursor=&limit=
    .MapPost("/track-url", TrackUrl)             // RequireAuthorization
    .MapGet("/{asin}", GetProduct)
    .MapGet("/{asin}/prices", GetPriceHistory);  // ?range=90d

// DashboardEndpoints
app.MapGroup("/api")
    .MapGet("/dashboard", GetDashboard)          // RequireAuthorization
    .RequireAuthorization();

// TrackedItemEndpoints
app.MapGroup("/api/tracked-items")
    .MapPost("/{id}/alert", SetAlert)
    .MapPut("/{id}/alert", UpdateAlert)
    .MapDelete("/{id}", RemoveTrackedItem)
    .MapGet("/export", ExportCsv)
    .RequireAuthorization();

// CategoryEndpoints (public)
app.MapGroup("/api/categories")
    .MapGet("/", GetCategories)
    .MapGet("/{slug}", GetCategoryProducts);

// DealEndpoints (public)
app.MapGroup("/api")
    .MapGet("/deals", GetDeals);
```

### 9. Global Exception Handler
```csharp
app.UseExceptionHandler(errorApp => {
    errorApp.Run(async context => {
        var exception = context.Features.Get<IExceptionHandlerFeature>()?.Error;
        var (statusCode, errorCode) = exception switch {
            KeyNotFoundException => (404, "NOT_FOUND"),
            UnauthorizedAccessException => (401, "UNAUTHORIZED"),
            ArgumentException => (400, "VALIDATION_ERROR"),
            _ => (500, "INTERNAL_ERROR")
        };
        context.Response.StatusCode = statusCode;
        await context.Response.WriteAsJsonAsync(new ApiErrorResponse(
            new ApiError(errorCode, exception?.Message ?? "An error occurred")));
    });
});
```

### 10. Rate Limiting (per endpoint group)
```csharp
builder.Services.AddRateLimiter(options => {
    options.AddFixedWindowLimiter("search", opt => { opt.PermitLimit = 30; opt.Window = TimeSpan.FromMinutes(1); });
    options.AddFixedWindowLimiter("track-url", opt => { opt.PermitLimit = 10; opt.Window = TimeSpan.FromMinutes(1); });
    options.AddFixedWindowLimiter("general", opt => { opt.PermitLimit = 60; opt.Window = TimeSpan.FromMinutes(1); });
});
```

## Todo List
- [x] Common DTOs: ApiResponse, PaginationMeta, CursorPaginationParams
- [x] IProductService + ProductService implementation
- [x] DealScoreCalculator helper
- [x] IDashboardService + DashboardService
- [x] ITrackedItemService + TrackedItemService (CRUD + CSV export)
- [x] ICategoryService + CategoryService
- [x] IDealService + DealService
- [x] IAmazonProductService interface (impl in Phase 5)
- [x] 5 Minimal API endpoint groups (12 endpoints total)
- [x] GlobalExceptionHandler middleware
- [x] Rate limiting per group
- [x] DI registrations for all services
- [x] All endpoints return correct status codes per API_SPEC

## Success Criteria
- All 12 non-auth endpoints respond with correct JSON shape per API_SPEC
- Cursor pagination works: returns `hasMore` + `cursor` correctly
- Deal score calculation matches algorithm spec
- Dashboard summary counts are accurate
- CSV export produces valid CSV with correct headers
- 401 returned for protected endpoints without JWT
- Rate limits enforced per endpoint group
- Global error handler returns standardized error format

## Risk Assessment
| Risk | Impact | Mitigation |
|------|--------|------------|
| IAmazonProductService not yet implemented | Medium | Use mock/stub until Phase 5; search falls back to DB |
| Cursor pagination with sorting | Medium | For MVP, cursor works with single sort field; complex sorts use offset fallback |
| Large sparkline queries | Low | Limit to last 5 prices per product; batch query |
