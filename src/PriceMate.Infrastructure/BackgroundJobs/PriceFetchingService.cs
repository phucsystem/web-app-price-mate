using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using PriceMate.Application.Interfaces;
using PriceMate.Domain.Entities;
using PriceMate.Infrastructure.Persistence;

namespace PriceMate.Infrastructure.BackgroundJobs;

public class PriceFetchingService(
    IServiceProvider serviceProvider,
    ILogger<PriceFetchingService> logger) : BackgroundService
{
    private const int IntervalHours = 5;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var timer = new PeriodicTimer(TimeSpan.FromHours(IntervalHours));

        await FetchPricesAsync(stoppingToken);

        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            await FetchPricesAsync(stoppingToken);
        }
    }

    private async Task FetchPricesAsync(CancellationToken ct)
    {
        try
        {
            using var scope = serviceProvider.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var amazonService = scope.ServiceProvider.GetRequiredService<IAmazonProductService>();
            var alertChecker = scope.ServiceProvider.GetRequiredService<IAlertCheckerService>();

            var products = await dbContext.Products
                .Where(product => product.TrackedItems.Any(ti => ti.IsActive))
                .OrderBy(product => product.LastFetchedAt)
                .ToListAsync(ct);

            if (products.Count == 0)
            {
                logger.LogDebug("No products with active tracked items to fetch");
                return;
            }

            logger.LogInformation("Starting price fetch for {Count} products", products.Count);

            foreach (var batch in products.Chunk(10))
            {
                var asins = batch.Select(product => product.Asin).ToList();
                var priceData = await amazonService.GetItemsByAsinAsync(asins, ct);

                foreach (var data in priceData)
                {
                    if (data.CurrentPrice == null) continue;

                    var product = batch.First(product => product.Asin == data.Asin);

                    dbContext.PriceRecords.Add(new PriceRecord
                    {
                        Id = Guid.NewGuid(),
                        ProductId = product.Id,
                        Price = data.CurrentPrice.Value,
                        RecordedAt = DateTime.UtcNow
                    });

                    product.CurrentPrice = data.CurrentPrice.Value;
                    product.LastFetchedAt = DateTime.UtcNow;

                    if (product.LowestPrice == 0 || data.CurrentPrice < product.LowestPrice)
                        product.LowestPrice = data.CurrentPrice.Value;
                    if (product.HighestPrice == 0 || data.CurrentPrice > product.HighestPrice)
                        product.HighestPrice = data.CurrentPrice.Value;
                }

                await dbContext.SaveChangesAsync(ct);
            }

            await alertChecker.CheckAndTriggerAlertsAsync(ct);
            logger.LogInformation("Price fetch cycle completed for {Count} products", products.Count);
        }
        catch (OperationCanceledException)
        {
            // Expected on shutdown
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error during price fetch cycle. Will retry on next tick.");
        }
    }
}
