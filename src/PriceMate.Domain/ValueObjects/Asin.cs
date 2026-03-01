namespace PriceMate.Domain.ValueObjects;

public record Asin
{
    public string Value { get; }

    public Asin(string value)
    {
        if (string.IsNullOrWhiteSpace(value) || value.Length != 10)
            throw new ArgumentException("ASIN must be exactly 10 characters", nameof(value));
        Value = value.ToUpperInvariant();
    }
}
