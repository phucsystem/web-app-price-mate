namespace PriceMate.Application.Interfaces;

public interface IEmailService
{
    Task SendPasswordResetEmailAsync(string toEmail, string resetToken, CancellationToken ct);
    Task SendPriceAlertAsync(string toEmail, string productTitle, decimal currentPrice, decimal targetPrice, string amazonUrl, CancellationToken ct);
}
