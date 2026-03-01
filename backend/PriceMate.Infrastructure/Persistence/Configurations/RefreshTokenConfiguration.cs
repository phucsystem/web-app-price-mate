using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PriceMate.Domain.Entities;

namespace PriceMate.Infrastructure.Persistence.Configurations;

public class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> builder)
    {
        builder.ToTable("refresh_tokens");

        builder.HasKey(token => token.Id);
        builder.Property(token => token.Id)
            .HasDefaultValueSql("gen_random_uuid()");

        builder.Property(token => token.Token)
            .IsRequired()
            .HasMaxLength(512);
        builder.HasIndex(token => token.Token)
            .IsUnique()
            .HasDatabaseName("idx_refresh_tokens_token");

        builder.Property(token => token.ExpiresAt)
            .IsRequired();

        builder.Property(token => token.CreatedAt)
            .IsRequired();

        builder.HasIndex(token => token.UserId)
            .HasDatabaseName("idx_refresh_tokens_user");
    }
}
