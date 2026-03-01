namespace PriceMate.Application.Helpers;

public static class DealScoreCalculator
{
    public static string? Calculate(decimal? current, decimal? lowest, decimal? highest)
    {
        if (current is null || lowest is null || highest is null) return null;
        var range = highest.Value - lowest.Value;
        if (range <= 0) return null;
        var position = (highest.Value - current.Value) / range;
        return position switch
        {
            >= 0.7m => "great",
            >= 0.4m => "good",
            >= 0.1m => "average",
            _ => null
        };
    }
}
