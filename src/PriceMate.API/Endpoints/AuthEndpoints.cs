using System.Security.Claims;
using PriceMate.Application.DTOs.Auth;
using PriceMate.Application.Interfaces;

namespace PriceMate.API.Endpoints;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/auth").RequireRateLimiting("auth");

        group.MapPost("/register", async (RegisterRequest request, IAuthService authService, CancellationToken ct) =>
        {
            try
            {
                var response = await authService.RegisterAsync(request, ct);
                return Results.Created("/api/auth", response);
            }
            catch (InvalidOperationException ex)
            {
                return Results.Conflict(new { error = ex.Message });
            }
        });

        group.MapPost("/login", async (LoginRequest request, IAuthService authService, CancellationToken ct) =>
        {
            try
            {
                var response = await authService.LoginAsync(request, ct);
                return Results.Ok(response);
            }
            catch (UnauthorizedAccessException)
            {
                return Results.Unauthorized();
            }
        });

        group.MapPost("/refresh", async (RefreshRequest request, IAuthService authService, CancellationToken ct) =>
        {
            try
            {
                var response = await authService.RefreshTokenAsync(request.RefreshToken, ct);
                return Results.Ok(response);
            }
            catch (UnauthorizedAccessException)
            {
                return Results.Unauthorized();
            }
        });

        group.MapPost("/logout", async (HttpContext httpContext, IAuthService authService, CancellationToken ct) =>
        {
            var userIdClaim = httpContext.User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? httpContext.User.FindFirstValue("sub");

            if (!Guid.TryParse(userIdClaim, out var userId))
                return Results.Unauthorized();

            await authService.LogoutAsync(userId, ct);
            return Results.Ok();
        }).RequireAuthorization();

        group.MapPost("/forgot-password", async (ForgotPasswordRequest request, IAuthService authService, CancellationToken ct) =>
        {
            await authService.ForgotPasswordAsync(request.Email, ct);
            return Results.Ok(new { message = "If that email is registered, a reset link has been sent." });
        });

        group.MapPost("/reset-password", async (ResetPasswordRequest request, IAuthService authService, CancellationToken ct) =>
        {
            try
            {
                await authService.ResetPasswordAsync(request, ct);
                return Results.Ok(new { message = "Password reset successfully." });
            }
            catch (InvalidOperationException ex)
            {
                return Results.BadRequest(new { error = ex.Message });
            }
        });
    }
}
