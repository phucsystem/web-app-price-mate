namespace PriceMate.Infrastructure.ExternalApis;

public record AmazonApiConfig(
    string AccessKey,
    string SecretKey,
    string PartnerId,
    string Host,
    string Region
);
