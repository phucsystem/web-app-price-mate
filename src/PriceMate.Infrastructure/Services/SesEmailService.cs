using Amazon;
using Amazon.Runtime;
using Amazon.SimpleEmail;
using Amazon.SimpleEmail.Model;
using Microsoft.Extensions.Logging;
using PriceMate.Application.Interfaces;

namespace PriceMate.Infrastructure.Services;

public record SesConfig(string AccessKey, string SecretKey, string SenderEmail, string Region, bool UseSes);

public class SesEmailService(SesConfig config, ILogger<SesEmailService> logger) : IEmailService
{
    public async Task SendPasswordResetEmailAsync(string toEmail, string resetToken, CancellationToken ct)
    {
        var subject = "Reset Your PriceMate Password";
        var body = $"Click the link below to reset your password. This link expires in 1 hour.\n\n" +
                   $"Reset link: {resetToken}\n\n" +
                   $"If you did not request a password reset, please ignore this email.";

        await SendEmailAsync(toEmail, subject, body, ct);
    }

    public async Task SendPriceAlertAsync(string toEmail, string productTitle, decimal currentPrice, decimal targetPrice, string amazonUrl, CancellationToken ct)
    {
        var subject = $"Price Drop Alert: {productTitle}";
        var body = $"Good news! The price of {productTitle} has dropped to ${currentPrice:F2} AUD " +
                   $"(your target was ${targetPrice:F2} AUD).\n\n" +
                   $"View on Amazon: {amazonUrl}\n\n" +
                   $"Happy shopping!\nThe PriceMate Team";

        await SendEmailAsync(toEmail, subject, body, ct);
    }

    private async Task SendEmailAsync(string toEmail, string subject, string body, CancellationToken ct)
    {
        if (!config.UseSes)
        {
            logger.LogInformation("SES disabled. Would send email to {Email}: {Subject}", toEmail, subject);
            return;
        }

        var credentials = new BasicAWSCredentials(config.AccessKey, config.SecretKey);
        var region = RegionEndpoint.GetBySystemName(config.Region);
        using var client = new AmazonSimpleEmailServiceClient(credentials, region);

        var request = new SendEmailRequest
        {
            Source = config.SenderEmail,
            Destination = new Destination { ToAddresses = [toEmail] },
            Message = new Message
            {
                Subject = new Content(subject),
                Body = new Body { Text = new Content(body) }
            }
        };

        await client.SendEmailAsync(request, ct);
        logger.LogInformation("Email sent to {Email}: {Subject}", toEmail, subject);
    }
}
