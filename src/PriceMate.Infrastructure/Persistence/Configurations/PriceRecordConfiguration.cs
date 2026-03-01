using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PriceMate.Domain.Entities;

namespace PriceMate.Infrastructure.Persistence.Configurations;

public class PriceRecordConfiguration : IEntityTypeConfiguration<PriceRecord>
{
    public void Configure(EntityTypeBuilder<PriceRecord> builder)
    {
        builder.ToTable("price_records");

        builder.HasKey(record => record.Id);
        builder.Property(record => record.Id)
            .HasDefaultValueSql("gen_random_uuid()");

        builder.Property(record => record.Price)
            .IsRequired()
            .HasPrecision(10, 2);

        builder.Property(record => record.RecordedAt)
            .IsRequired();

        builder.HasIndex(record => new { record.ProductId, record.RecordedAt })
            .HasDatabaseName("idx_price_records_product_recorded");
    }
}
