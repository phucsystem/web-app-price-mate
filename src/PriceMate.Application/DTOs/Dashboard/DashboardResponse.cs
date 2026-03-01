namespace PriceMate.Application.DTOs.Dashboard;

public record DashboardSummary(int TotalTracked, int ActiveAlerts, int RecentDrops);

public record DashboardResponse(DashboardSummary Summary, List<TrackedItemDto> Items);
