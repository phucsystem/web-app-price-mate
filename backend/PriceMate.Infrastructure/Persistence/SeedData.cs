using Microsoft.EntityFrameworkCore;
using PriceMate.Domain.Entities;

namespace PriceMate.Infrastructure.Persistence;

public static class SeedData
{
    private static readonly (string Name, string Slug)[] AmazonAuCategories =
    [
        ("Electronics", "electronics"),
        ("Home & Kitchen", "home-kitchen"),
        ("Books", "books"),
        ("Sports & Outdoors", "sports-outdoors"),
        ("Beauty", "beauty"),
        ("Fashion", "fashion"),
        ("Toys & Games", "toys-games"),
        ("Automotive", "automotive"),
        ("Pet Supplies", "pet-supplies"),
        ("Health", "health"),
        ("Baby", "baby"),
        ("Office Products", "office-products"),
        ("Garden", "garden"),
        ("Tools", "tools"),
        ("Grocery", "grocery"),
    ];

    public static async Task SeedAsync(ApplicationDbContext context)
    {
        if (await context.Categories.AnyAsync())
            return;

        var categories = AmazonAuCategories.Select(entry => new Category
        {
            Id = Guid.NewGuid(),
            Name = entry.Name,
            Slug = entry.Slug,
            ProductCount = 0,
        }).ToList();

        await context.Categories.AddRangeAsync(categories);
        await context.SaveChangesAsync();
    }
}
