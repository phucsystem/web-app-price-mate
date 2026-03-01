using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using PriceMate.Application.Interfaces;
using PriceMate.Domain.Entities;
using PriceMate.Domain.Enums;
using PriceMate.Infrastructure.Persistence;

namespace PriceMate.Infrastructure.Services;

public class AlertCheckerService(
    ApplicationDbContext dbContext,
    IEmailService emailService,
    ILogger<AlertCheckerService> logger) : IAlertCheckerService
{
    public async Task CheckAndTriggerAlertsAsync(CancellationToken ct = default)
    {
        var alertCutoff = DateTime.UtcNow.AddHours(-24);

        var eligibleItems = await dbContext.TrackedItems
            .Include(ti => ti.Product)
            .Include(ti => ti.User)
            .Include(ti => ti.Alerts)
            .Where(ti => ti.IsActive
                && ti.TargetPrice != null
                && ti.Product.CurrentPrice <= ti.TargetPrice
                && !ti.Alerts.Any(alert => alert.SentAt > alertCutoff))
            .ToListAsync(ct);

        if (eligibleItems.Count == 0)
            return;

        logger.LogInformation("Found {Count} tracked items eligible for price drop alerts", eligibleItems.Count);

        foreach (var item in eligibleItems)
        {
            try
            {
                dbContext.Alerts.Add(new Alert
                {
                    Id = Guid.NewGuid(),
                    TrackedItemId = item.Id,
                    Type = AlertType.PriceDrop,
                    PriceAtAlert = item.Product.CurrentPrice,
                    SentAt = DateTime.UtcNow
                });

                await emailService.SendPriceAlertAsync(
                    item.User.Email,
                    item.Product.Title,
                    item.Product.CurrentPrice,
                    item.TargetPrice!.Value,
                    item.Product.AmazonUrl,
                    ct);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to send alert for tracked item {TrackedItemId}", item.Id);
            }
        }

        await dbContext.SaveChangesAsync(ct);
    }
}
