# Phase Implementation Report

## Executed Phase
- Phase: phase-05-amazon-integration
- Plan: /Users/phuc/Code/02-web/web-price-mate-au/plans/260301-0852-full-mvp-implementation/
- Status: completed

## Files Modified

### Application Layer (contracts)
- `src/PriceMate.Application/Interfaces/IAmazonProductService.cs` — updated signature to use Amazon DTOs
- `src/PriceMate.Application/Interfaces/IEmailService.cs` — added `SendPriceAlertAsync` method
- `src/PriceMate.Application/Interfaces/IAlertCheckerService.cs` — created (new)
- `src/PriceMate.Application/DTOs/Amazon/AmazonSearchResult.cs` — created (new)
- `src/PriceMate.Application/DTOs/Amazon/AmazonProductData.cs` — created (new)

### Infrastructure Layer (implementations)
- `src/PriceMate.Infrastructure/ExternalApis/AmazonApiConfig.cs` — created (new)
- `src/PriceMate.Infrastructure/ExternalApis/AwsSigV4Signer.cs` — created (new, ~80 lines)
- `src/PriceMate.Infrastructure/ExternalApis/AmazonProductService.cs` — created (new, ~190 lines)
- `src/PriceMate.Infrastructure/Services/AlertCheckerService.cs` — created (new)
- `src/PriceMate.Infrastructure/Services/EmailService.cs` — updated stub to implement new interface
- `src/PriceMate.Infrastructure/Services/SesEmailService.cs` — created (new)
- `src/PriceMate.Infrastructure/BackgroundJobs/PriceFetchingService.cs` — created (new)
- `src/PriceMate.Infrastructure/BackgroundJobs/TokenCleanupService.cs` — created (new)
- `src/PriceMate.Infrastructure/PriceMate.Infrastructure.csproj` — added AWSSDK.Core, AWSSDK.SimpleEmail, Microsoft.Extensions.Hosting.Abstractions

### API Layer
- `src/PriceMate.API/Program.cs` — added Amazon + SES config binding, all DI registrations, hosted services
- `src/PriceMate.API/appsettings.json` — added Amazon and Ses config sections

## Tasks Completed
- [x] IAmazonProductService + DTOs (AmazonSearchResult, AmazonProductData) in Application
- [x] AwsSigV4Signer — manual SigV4 implementation (canonical request, string-to-sign, HMAC key derivation)
- [x] AmazonProductService — SearchItems + GetItems with PA API JSON payloads, inline response models
- [x] Rate limiter (SemaphoreSlim 1/1 + 1100ms delay) + exponential backoff retry (max 3 attempts)
- [x] PriceFetchingService — PeriodicTimer 5hr, runs immediately on startup, batches of 10 ASINs, updates product stats
- [x] IAlertCheckerService + AlertCheckerService — 24h dedup, creates Alert record, sends email
- [x] SesEmailService — `UseSes` flag for dev stub fallback, price alert + password reset templates
- [x] TokenCleanupService — daily PeriodicTimer, ExecuteDeleteAsync for expired tokens
- [x] Amazon + SES config sections in appsettings.json
- [x] DI: AddHttpClient<IAmazonProductService>, AddScoped<IAlertCheckerService>, AddScoped<IEmailService, SesEmailService>, AddHostedService x2

## Tests Status
- Type check: pass
- Build: `dotnet build PriceMate.sln` — 0 warnings, 0 errors

## Issues Encountered

**IAmazonProductService signature mismatch** — Phase 4 created the interface using `ProductDto`/`ProductDetailDto` (application-layer DTOs). Phase 5 requires `AmazonSearchResult`/`AmazonProductData` (infrastructure-specific data shapes). Updated interface to use the correct Amazon DTOs per plan spec.

**IEmailService signature mismatch** — Existing interface only had `SendPasswordResetEmailAsync`. Added `SendPriceAlertAsync` with flat parameters (no domain entity deps in interface) to keep Application layer clean.

**BackgroundService not found** — Infrastructure project lacked `Microsoft.Extensions.Hosting.Abstractions`. Added package v9.0.3.

**AWSSDK v4 API** — Installed packages resolved to v4.0.x (not v3.x as plan examples implied). Verified `AmazonSimpleEmailServiceClient`, `BasicAWSCredentials`, `RegionEndpoint` APIs still match in v4.

**SigV4 target header** — PA API requires `X-Amz-Target` header (not standard AWS SigV4). Implemented `GetTargetHeader()` helper deriving target from request path.

**Retry logic semaphore release** — Original plan pattern had double-release risk. Restructured to: acquire → try/finally release → catch 429 separately, with clean flow avoiding double-release.

## Next Steps
- Phase 6+ can depend on `IAmazonProductService` being available via DI
- `ProductService.TrackByUrlAsync` creates stub Product records; after PA API integration, it should call `IAmazonProductService.SearchItemsAsync` to populate real title/image/price on first track
- SES needs real credentials + verified sender domain before production use (`"UseSes": true`)
- PA API deprecation April 2026 — monitor Amazon Creators API for migration path

## Unresolved Questions
- None
