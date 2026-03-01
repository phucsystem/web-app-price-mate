namespace PriceMate.Domain.ValueObjects;

public record Money(decimal Amount)
{
    public static Money Zero => new(0m);
    public bool IsPositive => Amount > 0;
}
