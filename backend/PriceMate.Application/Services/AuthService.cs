using Microsoft.EntityFrameworkCore;
using PriceMate.Application.DTOs.Auth;
using PriceMate.Application.Interfaces;
using PriceMate.Domain.Entities;

namespace PriceMate.Application.Services;

public class AuthService(
    IApplicationDbContext dbContext,
    IJwtTokenService tokenService,
    IPasswordHasher passwordHasher,
    IEmailService emailService) : IAuthService
{
    public async Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken ct)
    {
        var emailExists = await dbContext.Users
            .AnyAsync(user => user.Email == request.Email.ToLower(), ct);

        if (emailExists)
            throw new InvalidOperationException("Email already registered.");

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = request.Email.ToLower(),
            PasswordHash = passwordHasher.Hash(request.Password),
            DisplayName = request.DisplayName,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        dbContext.Users.Add(user);

        var refreshToken = CreateRefreshToken(user);
        await dbContext.SaveChangesAsync(ct);

        return BuildAuthResponse(user, tokenService.GenerateAccessToken(user), refreshToken.Token);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken ct)
    {
        var user = await dbContext.Users
            .FirstOrDefaultAsync(u => u.Email == request.Email.ToLower(), ct)
            ?? throw new UnauthorizedAccessException("Invalid credentials.");

        if (!passwordHasher.Verify(request.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Invalid credentials.");

        var refreshToken = CreateRefreshToken(user);
        await dbContext.SaveChangesAsync(ct);

        return BuildAuthResponse(user, tokenService.GenerateAccessToken(user), refreshToken.Token);
    }

    public async Task<AuthResponse> RefreshTokenAsync(string refreshToken, CancellationToken ct)
    {
        var storedToken = await dbContext.RefreshTokens
            .Include(rt => rt.User)
            .FirstOrDefaultAsync(rt => rt.Token == refreshToken, ct)
            ?? throw new UnauthorizedAccessException("Invalid refresh token.");

        if (storedToken.ExpiresAt < DateTime.UtcNow)
            throw new UnauthorizedAccessException("Refresh token expired.");

        dbContext.RefreshTokens.Remove(storedToken);

        var newRefreshToken = CreateRefreshToken(storedToken.User);
        await dbContext.SaveChangesAsync(ct);

        return BuildAuthResponse(
            storedToken.User,
            tokenService.GenerateAccessToken(storedToken.User),
            newRefreshToken.Token);
    }

    public async Task LogoutAsync(Guid userId, CancellationToken ct)
    {
        var tokens = await dbContext.RefreshTokens
            .Where(rt => rt.UserId == userId)
            .ToListAsync(ct);

        dbContext.RefreshTokens.RemoveRange(tokens);
        await dbContext.SaveChangesAsync(ct);
    }

    public async Task ForgotPasswordAsync(string email, CancellationToken ct)
    {
        var user = await dbContext.Users
            .FirstOrDefaultAsync(u => u.Email == email.ToLower(), ct);

        if (user is null)
            return;

        user.ResetToken = tokenService.GenerateRefreshToken();
        user.ResetTokenExpires = DateTime.UtcNow.AddHours(1);
        user.UpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync(ct);
        await emailService.SendPasswordResetEmailAsync(user.Email, user.ResetToken, ct);
    }

    public async Task ResetPasswordAsync(ResetPasswordRequest request, CancellationToken ct)
    {
        var user = await dbContext.Users
            .FirstOrDefaultAsync(u => u.ResetToken == request.Token, ct)
            ?? throw new InvalidOperationException("Invalid or expired reset token.");

        if (user.ResetTokenExpires < DateTime.UtcNow)
            throw new InvalidOperationException("Reset token has expired.");

        user.PasswordHash = passwordHasher.Hash(request.NewPassword);
        user.ResetToken = null;
        user.ResetTokenExpires = null;
        user.UpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync(ct);
    }

    private RefreshToken CreateRefreshToken(User user)
    {
        var refreshToken = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Token = tokenService.GenerateRefreshToken(),
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            CreatedAt = DateTime.UtcNow
        };

        dbContext.RefreshTokens.Add(refreshToken);
        return refreshToken;
    }

    private static AuthResponse BuildAuthResponse(User user, string accessToken, string refreshToken)
        => new(accessToken, refreshToken, new AuthUserDto(user.Id, user.Email, user.DisplayName));
}
