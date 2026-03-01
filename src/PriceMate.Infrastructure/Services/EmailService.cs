using Microsoft.Extensions.Logging;
using PriceMate.Application.Interfaces;

namespace PriceMate.Infrastructure.Services;

public class EmailService(ILogger<EmailService> logger) : IEmailService
{
    public Task SendPasswordResetEmailAsync(string toEmail, string resetToken, CancellationToken ct)
    {
        logger.LogInformation(
            "Password reset email would be sent to {Email} with token {Token}",
            toEmail, resetToken);
        return Task.CompletedTask;
    }

    public Task SendPriceAlertAsync(string toEmail, string productTitle, decimal currentPrice, decimal targetPrice, string amazonUrl, CancellationToken ct)
    {
        logger.LogInformation(
            "Price alert email would be sent to {Email}: {Title} dropped to {Price} (target: {Target})",
            toEmail, productTitle, currentPrice, targetPrice);
        return Task.CompletedTask;
    }
}
