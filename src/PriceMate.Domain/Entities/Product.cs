namespace PriceMate.Domain.Entities;

public class Product : BaseEntity
{
    public string Asin { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public string AmazonUrl { get; set; } = string.Empty;
    public Guid CategoryId { get; set; }
    public decimal CurrentPrice { get; set; }
    public decimal LowestPrice { get; set; }
    public decimal HighestPrice { get; set; }
    public decimal AveragePrice { get; set; }
    public DateTime? LastFetchedAt { get; set; }
    public DateTime CreatedAt { get; set; }

    public Category Category { get; set; } = null!;
    public ICollection<PriceRecord> PriceRecords { get; set; } = new List<PriceRecord>();
    public ICollection<TrackedItem> TrackedItems { get; set; } = new List<TrackedItem>();
}
