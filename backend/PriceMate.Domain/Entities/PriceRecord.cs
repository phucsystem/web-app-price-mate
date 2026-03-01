namespace PriceMate.Domain.Entities;

public class PriceRecord : BaseEntity
{
    public Guid ProductId { get; set; }
    public decimal Price { get; set; }
    public DateTime RecordedAt { get; set; }

    public Product Product { get; set; } = null!;
}
