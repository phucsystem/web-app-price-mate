using System.Security.Cryptography;
using System.Text;

namespace PriceMate.Infrastructure.ExternalApis;

public class AwsSigV4Signer
{
    private const string Algorithm = "AWS4-HMAC-SHA256";
    private const string ServiceName = "ProductAdvertisingAPI";

    public void SignRequest(HttpRequestMessage request, string payload, AmazonApiConfig config)
    {
        var utcNow = DateTime.UtcNow;
        var dateStamp = utcNow.ToString("yyyyMMdd");
        var amzDate = utcNow.ToString("yyyyMMddTHHmmssZ");

        request.Headers.TryAddWithoutValidation("X-Amz-Date", amzDate);
        request.Headers.TryAddWithoutValidation("X-Amz-Target", GetTargetHeader(request));

        var payloadHash = HashSha256(payload);
        var canonicalHeaders = BuildCanonicalHeaders(request, config.Host, amzDate);
        var signedHeaders = BuildSignedHeaderNames(request);
        var canonicalRequest = BuildCanonicalRequest(request, canonicalHeaders, signedHeaders, payloadHash);

        var credentialScope = $"{dateStamp}/{config.Region}/{ServiceName}/aws4_request";
        var stringToSign = BuildStringToSign(amzDate, credentialScope, canonicalRequest);

        var signingKey = DeriveSigningKey(config.SecretKey, dateStamp, config.Region);
        var signature = ToHex(HmacSha256(signingKey, stringToSign));

        var authHeader = $"{Algorithm} Credential={config.AccessKey}/{credentialScope}, SignedHeaders={signedHeaders}, Signature={signature}";
        request.Headers.TryAddWithoutValidation("Authorization", authHeader);
    }

    private static string GetTargetHeader(HttpRequestMessage request)
    {
        var path = request.RequestUri?.AbsolutePath ?? string.Empty;
        return path.EndsWith("searchitems", StringComparison.OrdinalIgnoreCase)
            ? "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems"
            : "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.GetItems";
    }

    private static string BuildCanonicalHeaders(HttpRequestMessage request, string host, string amzDate)
    {
        var sb = new StringBuilder();
        sb.Append($"content-type:{request.Content?.Headers.ContentType}\n");
        sb.Append($"host:{host}\n");
        sb.Append($"x-amz-date:{amzDate}\n");
        sb.Append($"x-amz-target:{GetTargetHeader(request)}\n");
        return sb.ToString();
    }

    private static string BuildSignedHeaderNames(HttpRequestMessage request)
        => "content-type;host;x-amz-date;x-amz-target";

    private static string BuildCanonicalRequest(
        HttpRequestMessage request,
        string canonicalHeaders,
        string signedHeaders,
        string payloadHash)
    {
        var method = request.Method.Method;
        var uri = request.RequestUri?.AbsolutePath ?? "/";
        var queryString = request.RequestUri?.Query?.TrimStart('?') ?? string.Empty;

        return string.Join("\n", method, uri, queryString, canonicalHeaders, signedHeaders, payloadHash);
    }

    private static string BuildStringToSign(string amzDate, string credentialScope, string canonicalRequest)
        => string.Join("\n", Algorithm, amzDate, credentialScope, HashSha256(canonicalRequest));

    private static byte[] DeriveSigningKey(string secretKey, string dateStamp, string region)
    {
        var kDate = HmacSha256(Encoding.UTF8.GetBytes($"AWS4{secretKey}"), dateStamp);
        var kRegion = HmacSha256(kDate, region);
        var kService = HmacSha256(kRegion, ServiceName);
        return HmacSha256(kService, "aws4_request");
    }

    private static string HashSha256(string data)
    {
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(data));
        return ToHex(hash);
    }

    private static byte[] HmacSha256(byte[] key, string data)
        => HMACSHA256.HashData(key, Encoding.UTF8.GetBytes(data));

    private static string ToHex(byte[] bytes)
        => Convert.ToHexString(bytes).ToLowerInvariant();
}
