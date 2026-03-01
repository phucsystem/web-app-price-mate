namespace PriceMate.Domain.Entities;

public class TrackedItem : BaseEntity
{
    public Guid UserId { get; set; }
    public Guid ProductId { get; set; }
    public decimal? TargetPrice { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }

    public User User { get; set; } = null!;
    public Product Product { get; set; } = null!;
    public ICollection<Alert> Alerts { get; set; } = new List<Alert>();
}
