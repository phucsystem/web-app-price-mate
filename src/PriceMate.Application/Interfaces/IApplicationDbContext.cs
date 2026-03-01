using Microsoft.EntityFrameworkCore;
using PriceMate.Domain.Entities;

namespace PriceMate.Application.Interfaces;

public interface IApplicationDbContext
{
    DbSet<User> Users { get; }
    DbSet<Product> Products { get; }
    DbSet<PriceRecord> PriceRecords { get; }
    DbSet<TrackedItem> TrackedItems { get; }
    DbSet<Alert> Alerts { get; }
    DbSet<Category> Categories { get; }
    DbSet<RefreshToken> RefreshTokens { get; }

    Task<int> SaveChangesAsync(CancellationToken ct = default);
}
