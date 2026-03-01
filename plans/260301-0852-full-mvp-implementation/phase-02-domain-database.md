# Phase 2: Domain & Database

## Overview
- **Priority:** P1
- **Status:** completed
- **Effort:** 8h
- **Description:** Domain entities, value objects, repository interfaces (Domain layer), EF Core DbContext + migrations (Infrastructure layer)

## Clean Architecture Principle: Domain Has ZERO External Dependencies

The Domain project references NO NuGet packages, NO other projects. It contains:
- **Entities**: Business objects with identity (User, Product, etc.)
- **Value Objects**: Immutable objects without identity (Money, Asin, EmailAddress)
- **Enums**: AlertType, DealScore
- **Interfaces**: IRepository<T>, IUnitOfWork — defined here, implemented in Infrastructure

This means EF Core, PostgreSQL, and all data access concerns live ONLY in Infrastructure.

## Key Insights
- DB_DESIGN specifies UUID PKs, `decimal(10,2)` for prices, `timestamptz` for dates
- 7 tables: users, products, price_records, tracked_items, alerts, categories, refresh_tokens
- Composite unique index on `(user_id, product_id)` in tracked_items prevents duplicates
- Partial index for alert checker: `WHERE is_active = true AND target_price IS NOT NULL`
- Category seed data needed for initial Amazon AU categories

## Related Code Files

### Domain Layer (create)
| File | Action |
|------|--------|
| `src/PriceMate.Domain/Entities/User.cs` | create |
| `src/PriceMate.Domain/Entities/Product.cs` | create |
| `src/PriceMate.Domain/Entities/PriceRecord.cs` | create |
| `src/PriceMate.Domain/Entities/TrackedItem.cs` | create |
| `src/PriceMate.Domain/Entities/Alert.cs` | create |
| `src/PriceMate.Domain/Entities/Category.cs` | create |
| `src/PriceMate.Domain/Entities/RefreshToken.cs` | create |
| `src/PriceMate.Domain/Entities/BaseEntity.cs` | create |
| `src/PriceMate.Domain/ValueObjects/Money.cs` | create |
| `src/PriceMate.Domain/ValueObjects/Asin.cs` | create |
| `src/PriceMate.Domain/ValueObjects/EmailAddress.cs` | create |
| `src/PriceMate.Domain/Enums/AlertType.cs` | create |
| `src/PriceMate.Domain/Enums/DealScore.cs` | create |
| `src/PriceMate.Domain/Interfaces/IRepository.cs` | create |
| `src/PriceMate.Domain/Interfaces/IUnitOfWork.cs` | create |

### Infrastructure Layer (create)
| File | Action |
|------|--------|
| `src/PriceMate.Infrastructure/Persistence/ApplicationDbContext.cs` | create |
| `src/PriceMate.Infrastructure/Persistence/Configurations/UserConfiguration.cs` | create |
| `src/PriceMate.Infrastructure/Persistence/Configurations/ProductConfiguration.cs` | create |
| `src/PriceMate.Infrastructure/Persistence/Configurations/PriceRecordConfiguration.cs` | create |
| `src/PriceMate.Infrastructure/Persistence/Configurations/TrackedItemConfiguration.cs` | create |
| `src/PriceMate.Infrastructure/Persistence/Configurations/AlertConfiguration.cs` | create |
| `src/PriceMate.Infrastructure/Persistence/Configurations/CategoryConfiguration.cs` | create |
| `src/PriceMate.Infrastructure/Persistence/Configurations/RefreshTokenConfiguration.cs` | create |
| `src/PriceMate.Infrastructure/Persistence/Repositories/Repository.cs` | create |
| `src/PriceMate.Infrastructure/Persistence/UnitOfWork.cs` | create |
| `src/PriceMate.Infrastructure/Persistence/SeedData.cs` | create |

### Application Layer (create)
| File | Action |
|------|--------|
| `src/PriceMate.Application/Interfaces/IApplicationDbContext.cs` | create |

## Implementation Steps

### 1. Base Entity
```csharp
// src/PriceMate.Domain/Entities/BaseEntity.cs
public abstract class BaseEntity
{
    public Guid Id { get; set; }
}
```

### 2. Value Objects
```csharp
// Money — wraps decimal with currency context
public record Money(decimal Amount)
{
    public static Money Zero => new(0m);
    public bool IsPositive => Amount > 0;
}

// Asin — validates 10-char alphanumeric Amazon ID
public record Asin
{
    public string Value { get; }
    public Asin(string value)
    {
        if (string.IsNullOrWhiteSpace(value) || value.Length != 10)
            throw new ArgumentException("ASIN must be 10 characters");
        Value = value.ToUpperInvariant();
    }
}

// EmailAddress — validates email format
public record EmailAddress
{
    public string Value { get; }
    public EmailAddress(string value)
    {
        if (!value.Contains('@'))
            throw new ArgumentException("Invalid email");
        Value = value.ToLowerInvariant();
    }
}
```

### 3. Domain Entities (follow DB_DESIGN exactly)
- `User`: Id, Email, PasswordHash, DisplayName, ResetToken, ResetTokenExpires, CreatedAt, UpdatedAt + nav: TrackedItems, RefreshTokens
- `Product`: Id, Asin, Title, ImageUrl, AmazonUrl, CategoryId, CurrentPrice, LowestPrice, HighestPrice, AveragePrice, LastFetchedAt, CreatedAt + nav: PriceRecords, TrackedItems, Category
- `PriceRecord`: Id, ProductId, Price, RecordedAt + nav: Product
- `TrackedItem`: Id, UserId, ProductId, TargetPrice, IsActive, CreatedAt + nav: User, Product, Alerts
- `Alert`: Id, TrackedItemId, Type (enum), PriceAtAlert, SentAt + nav: TrackedItem
- `Category`: Id, Name, Slug, ProductCount + nav: Products
- `RefreshToken`: Id, UserId, Token, ExpiresAt, CreatedAt + nav: User

### 4. Enums
```csharp
public enum AlertType { PriceDrop, BackInStock, DealScoreChange }
public enum DealScore { Great, Good, Average }
```

### 5. Repository Interfaces
```csharp
public interface IRepository<T> where T : BaseEntity
{
    Task<T?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<List<T>> GetAllAsync(CancellationToken ct = default);
    Task AddAsync(T entity, CancellationToken ct = default);
    void Update(T entity);
    void Remove(T entity);
}

public interface IUnitOfWork
{
    Task<int> SaveChangesAsync(CancellationToken ct = default);
}
```

### 6. Install EF Core packages in Infrastructure
```bash
dotnet add src/PriceMate.Infrastructure package Microsoft.EntityFrameworkCore --version 10.0.*
dotnet add src/PriceMate.Infrastructure package Npgsql.EntityFrameworkCore.PostgreSQL --version 10.0.*
dotnet add src/PriceMate.API package Microsoft.EntityFrameworkCore.Design --version 10.0.*
```

### 7. ApplicationDbContext
- Inherits `DbContext`, implements `IUnitOfWork`
- DbSet for each entity
- `OnModelCreating` applies all configurations via `ApplyConfigurationsFromAssembly`

### 8. Entity Configurations (Fluent API)
Each config in its own file implementing `IEntityTypeConfiguration<T>`:
- Table names: lowercase plural (`users`, `products`, etc.)
- UUID PKs with `HasDefaultValueSql("gen_random_uuid()")`
- Decimal precision: `.HasPrecision(10, 2)` for all price columns
- Unique constraints: email, asin, (user_id + product_id), category slug
- Indexes matching DB_DESIGN spec
- Cascade deletes: products→price_records, users→tracked_items, tracked_items→alerts
- Restrict deletes: users (soft delete preferred)

### 9. Generic Repository Implementation
```csharp
public class Repository<T> : IRepository<T> where T : BaseEntity
{
    private readonly ApplicationDbContext _context;
    private readonly DbSet<T> _dbSet;
    // Standard CRUD implementations
}
```

### 10. Register DbContext in DI (Program.cs)
```csharp
builder.Services.AddDbContextPool<ApplicationDbContext>(options =>
    options.UseNpgsql(connectionString, npgsql =>
    {
        npgsql.EnableRetryOnFailure(maxRetryCount: 3);
        npgsql.CommandTimeout(30);
    }));
builder.Services.AddScoped<IUnitOfWork>(sp => sp.GetRequiredService<ApplicationDbContext>());
builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
```

### 11. Initial Migration
```bash
dotnet ef migrations add InitialCreate \
  --project src/PriceMate.Infrastructure \
  --startup-project src/PriceMate.API
```

### 12. Seed Data — 15 Amazon AU categories
```csharp
// Electronics, Home & Kitchen, Books, Sports & Outdoors, Beauty,
// Fashion, Toys & Games, Automotive, Pet Supplies, Health,
// Baby, Office Products, Garden, Tools, Grocery
```

## Todo List
- [x] BaseEntity with Guid Id
- [x] 3 value objects: Money, Asin, EmailAddress
- [x] 2 enums: AlertType, DealScore
- [x] 7 domain entities matching DB_DESIGN
- [x] IRepository<T> + IUnitOfWork interfaces in Domain
- [x] ApplicationDbContext with all DbSets
- [x] 7 Fluent API configurations with indexes + constraints
- [x] Repository<T> implementation in Infrastructure
- [x] UnitOfWork implementation
- [x] NuGet packages installed (EF Core + Npgsql)
- [x] Initial migration created + applied
- [x] Category seed data (15 AU categories)
- [x] `dotnet build` succeeds

## Success Criteria
- All 7 entities compile with correct relationships
- Migration creates all tables matching DB_DESIGN schema
- `dotnet ef database update` applies cleanly against Docker PostgreSQL
- Categories seeded on first run
- Domain project has zero NuGet dependencies (verify .csproj)

## Risk Assessment
| Risk | Impact | Mitigation |
|------|--------|------------|
| EF Core 10 + Npgsql version mismatch | Medium | Pin both to same major version |
| UUID generation not supported | Low | PostgreSQL 17 has `gen_random_uuid()` built-in |
| Value objects mapping in EF Core | Medium | Use owned types or conversion; keep simple for MVP |
