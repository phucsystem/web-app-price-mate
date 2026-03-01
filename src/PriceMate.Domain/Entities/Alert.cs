using PriceMate.Domain.Enums;

namespace PriceMate.Domain.Entities;

public class Alert : BaseEntity
{
    public Guid TrackedItemId { get; set; }
    public AlertType Type { get; set; }
    public decimal PriceAtAlert { get; set; }
    public DateTime SentAt { get; set; }

    public TrackedItem TrackedItem { get; set; } = null!;
}
