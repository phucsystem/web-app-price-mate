namespace PriceMate.Application.DTOs.Common;

public record CursorPaginationParams(Guid? Cursor = null, int Limit = 20, string Sort = "date_added")
{
    public int ClampedLimit => Math.Clamp(Limit, 1, 50);
}
