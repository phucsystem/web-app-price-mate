using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PriceMate.Domain.Entities;

namespace PriceMate.Infrastructure.Persistence.Configurations;

public class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        builder.ToTable("products");

        builder.HasKey(product => product.Id);
        builder.Property(product => product.Id)
            .HasDefaultValueSql("gen_random_uuid()");

        builder.Property(product => product.Asin)
            .IsRequired()
            .HasMaxLength(10);
        builder.HasIndex(product => product.Asin).IsUnique();

        builder.Property(product => product.Title)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(product => product.ImageUrl)
            .HasMaxLength(1000);

        builder.Property(product => product.AmazonUrl)
            .IsRequired()
            .HasMaxLength(1000);

        builder.Property(product => product.CurrentPrice)
            .HasPrecision(10, 2);

        builder.Property(product => product.LowestPrice)
            .HasPrecision(10, 2);

        builder.Property(product => product.HighestPrice)
            .HasPrecision(10, 2);

        builder.Property(product => product.AveragePrice)
            .HasPrecision(10, 2);

        builder.Property(product => product.CreatedAt)
            .IsRequired();

        builder.HasMany(product => product.PriceRecords)
            .WithOne(record => record.Product)
            .HasForeignKey(record => record.ProductId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(product => product.TrackedItems)
            .WithOne(item => item.Product)
            .HasForeignKey(item => item.ProductId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
