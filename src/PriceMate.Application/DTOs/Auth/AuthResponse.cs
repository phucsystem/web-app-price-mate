namespace PriceMate.Application.DTOs.Auth;

public record AuthResponse(
    string AccessToken,
    string RefreshToken,
    AuthUserDto User);

public record AuthUserDto(Guid Id, string Email, string DisplayName);
