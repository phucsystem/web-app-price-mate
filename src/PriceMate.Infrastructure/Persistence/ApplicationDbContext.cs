using Microsoft.EntityFrameworkCore;
using PriceMate.Application.Interfaces;
using PriceMate.Domain.Entities;
using PriceMate.Domain.Interfaces;

namespace PriceMate.Infrastructure.Persistence;

public class ApplicationDbContext : DbContext, IUnitOfWork, IApplicationDbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<PriceRecord> PriceRecords => Set<PriceRecord>();
    public DbSet<TrackedItem> TrackedItems => Set<TrackedItem>();
    public DbSet<Alert> Alerts => Set<Alert>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
    }

    public override Task<int> SaveChangesAsync(CancellationToken ct = default)
        => base.SaveChangesAsync(ct);
}
