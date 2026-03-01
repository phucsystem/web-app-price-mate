using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PriceMate.Domain.Entities;

namespace PriceMate.Infrastructure.Persistence.Configurations;

public class TrackedItemConfiguration : IEntityTypeConfiguration<TrackedItem>
{
    public void Configure(EntityTypeBuilder<TrackedItem> builder)
    {
        builder.ToTable("tracked_items");

        builder.HasKey(item => item.Id);
        builder.Property(item => item.Id)
            .HasDefaultValueSql("gen_random_uuid()");

        builder.Property(item => item.TargetPrice)
            .HasPrecision(10, 2);

        builder.Property(item => item.IsActive)
            .HasDefaultValue(true);

        builder.Property(item => item.CreatedAt)
            .IsRequired();

        builder.HasIndex(item => new { item.UserId, item.ProductId })
            .IsUnique()
            .HasDatabaseName("idx_tracked_items_user_product");

        builder.HasIndex(item => new { item.IsActive, item.TargetPrice })
            .HasDatabaseName("idx_tracked_items_active_alerts");

        builder.HasMany(item => item.Alerts)
            .WithOne(alert => alert.TrackedItem)
            .HasForeignKey(alert => alert.TrackedItemId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
