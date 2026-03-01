namespace PriceMate.Application.Interfaces;

public interface IAlertCheckerService
{
    Task CheckAndTriggerAlertsAsync(CancellationToken ct = default);
}
