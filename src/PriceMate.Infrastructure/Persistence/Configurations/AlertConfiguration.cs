using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PriceMate.Domain.Entities;
using PriceMate.Domain.Enums;

namespace PriceMate.Infrastructure.Persistence.Configurations;

public class AlertConfiguration : IEntityTypeConfiguration<Alert>
{
    public void Configure(EntityTypeBuilder<Alert> builder)
    {
        builder.ToTable("alerts");

        builder.HasKey(alert => alert.Id);
        builder.Property(alert => alert.Id)
            .HasDefaultValueSql("gen_random_uuid()");

        builder.Property(alert => alert.Type)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(50);

        builder.Property(alert => alert.PriceAtAlert)
            .IsRequired()
            .HasPrecision(10, 2);

        builder.Property(alert => alert.SentAt)
            .IsRequired();

        builder.HasIndex(alert => alert.TrackedItemId)
            .HasDatabaseName("idx_alerts_tracked_item");
    }
}
