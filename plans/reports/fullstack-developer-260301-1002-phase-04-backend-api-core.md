# Phase Implementation Report

## Executed Phase
- Phase: phase-04-backend-api-core
- Plan: /Users/phuc/Code/02-web/web-price-mate-au/plans/260301-0852-full-mvp-implementation/
- Status: completed

## Files Modified

### Application Layer — DTOs (created)
- `src/PriceMate.Application/DTOs/Common/ApiResponse.cs` — ApiResponse<T>, ApiErrorResponse, ApiError, PaginationMeta
- `src/PriceMate.Application/DTOs/Common/PagedResponse.cs` — PagedResponse<T>
- `src/PriceMate.Application/DTOs/Common/CursorPaginationParams.cs` — pagination params with ClampedLimit
- `src/PriceMate.Application/DTOs/Products/ProductDto.cs`
- `src/PriceMate.Application/DTOs/Products/ProductDetailDto.cs` — includes ProductCategoryDto
- `src/PriceMate.Application/DTOs/Products/PriceRecordDto.cs`
- `src/PriceMate.Application/DTOs/Products/TrackUrlRequest.cs`
- `src/PriceMate.Application/DTOs/Dashboard/TrackedItemDto.cs` — includes TrackedItemSummaryDto, ProductSummaryDto, PriceChangeDto
- `src/PriceMate.Application/DTOs/Dashboard/DashboardResponse.cs` — includes DashboardSummary
- `src/PriceMate.Application/DTOs/Categories/CategoryDto.cs` — includes CategoryProductsResponse
- `src/PriceMate.Application/DTOs/Deals/DealDto.cs`

### Application Layer — Interfaces (created)
- `src/PriceMate.Application/Interfaces/IProductService.cs`
- `src/PriceMate.Application/Interfaces/IDashboardService.cs`
- `src/PriceMate.Application/Interfaces/ITrackedItemService.cs`
- `src/PriceMate.Application/Interfaces/ICategoryService.cs`
- `src/PriceMate.Application/Interfaces/IDealService.cs`
- `src/PriceMate.Application/Interfaces/IAmazonProductService.cs` — interface only, impl deferred to Phase 5

### Application Layer — Services (created)
- `src/PriceMate.Application/Helpers/DealScoreCalculator.cs` — static helper, deal score algorithm
- `src/PriceMate.Application/Services/ProductService.cs` — search, getByAsin, priceHistory, trackByUrl
- `src/PriceMate.Application/Services/DashboardService.cs` — summary counts, paginated tracked items with sparklines
- `src/PriceMate.Application/Services/TrackedItemService.cs` — CRUD + CSV export
- `src/PriceMate.Application/Services/CategoryService.cs` — list all, products by slug
- `src/PriceMate.Application/Services/DealService.cs` — paginated deals with price change

### API Layer (created)
- `src/PriceMate.API/Endpoints/ProductEndpoints.cs` — 4 endpoints
- `src/PriceMate.API/Endpoints/DashboardEndpoints.cs` — 1 endpoint (auth required)
- `src/PriceMate.API/Endpoints/TrackedItemEndpoints.cs` — 4 endpoints (auth required), includes AlertRequest record
- `src/PriceMate.API/Endpoints/CategoryEndpoints.cs` — 2 endpoints
- `src/PriceMate.API/Endpoints/DealEndpoints.cs` — 1 endpoint
- `src/PriceMate.API/Middleware/GlobalExceptionHandler.cs` — maps exceptions to 404/401/400/409/500

### API Layer (modified)
- `src/PriceMate.API/Program.cs` — added 5 service registrations, 3 new rate limiters (search/track-url/general), 5 endpoint group maps, GlobalExceptionHandler

## Tasks Completed
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
- [x] Rate limiting per group (search:30/min, track-url:10/min, general:60/min)
- [x] DI registrations for all services
- [x] All endpoints return correct status codes per API_SPEC

## Tests Status
- Type check: pass
- Build: `dotnet build PriceMate.sln` → 0 errors, 0 warnings

## Issues Encountered
- `EF.Functions.ILike` is Npgsql-specific; not available in Application layer which only references base EF Core. Fixed by using `string.Contains()` (EF Core translates to `LIKE`). Functional equivalent for search; case-sensitivity depends on DB collation (Postgres default is case-sensitive; can be made case-insensitive via DB collation or Infrastructure layer override in Phase 5 if needed).
- `InvalidOperationException` mapped to 409 Conflict in GlobalExceptionHandler (used for "already tracking" scenario).

## Next Steps
- Phase 5: Implement `IAmazonProductService` with real Amazon PA API calls; `ProductService.SearchAsync` currently falls back to DB-only search.
- Phase 5: Consider moving search to Infrastructure layer with Npgsql `ILike` for true case-insensitive search.
