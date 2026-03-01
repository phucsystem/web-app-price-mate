namespace PriceMate.Application.DTOs.Products;

public record TrackUrlRequest(string AmazonUrl, decimal? TargetPrice = null);
