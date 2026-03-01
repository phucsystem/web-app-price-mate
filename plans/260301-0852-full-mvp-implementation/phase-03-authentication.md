# Phase 3: Authentication

## Overview
- **Priority:** P1
- **Status:** completed
- **Effort:** 10h
- **Description:** JWT + refresh token auth system. Interfaces in Application, implementations in Infrastructure, endpoints in API.

## Clean Architecture: Application Orchestrates, Infrastructure Implements

```
API Layer                    Application Layer           Infrastructure Layer
─────────                    ─────────────────           ────────────────────
POST /auth/register    →     IAuthService.Register()  ←  AuthService (implements)
POST /auth/login       →     IAuthService.Login()     ←  - Uses IRepository<User>
POST /auth/refresh     →     IAuthService.Refresh()   ←  - Uses IJwtTokenService
POST /auth/logout      →     IAuthService.Logout()    ←  - Uses IPasswordHasher
POST /auth/forgot-pwd  →     IAuthService.ForgotPwd() ←  JwtTokenService (implements)
POST /auth/reset-pwd   →     IAuthService.ResetPwd()  ←  BcryptPasswordHasher
```

The API layer NEVER touches DbContext or BCrypt directly. It calls Application interfaces.

## Key Insights
- Access token: 15 min lifetime, JWT signed with HMAC-SHA256 (symmetric for MVP)
- Refresh token: 7 day lifetime, stored hashed in DB, one-time use (rotate on refresh)
- Password hashing: BCrypt via `BCrypt.Net-Next` NuGet
- Rate limit: 10 req/min on all `/auth/*` endpoints (API_SPEC)
- Frontend stores tokens in httpOnly cookies (set by Next.js API routes, not .NET)
- .NET returns tokens in JSON body; Next.js proxy sets cookies

## Related Code Files

### Application Layer (create)
| File | Action |
|------|--------|
| `src/PriceMate.Application/Interfaces/IAuthService.cs` | create |
| `src/PriceMate.Application/Interfaces/IJwtTokenService.cs` | create |
| `src/PriceMate.Application/Interfaces/IPasswordHasher.cs` | create |
| `src/PriceMate.Application/Interfaces/IEmailService.cs` | create |
| `src/PriceMate.Application/DTOs/Auth/RegisterRequest.cs` | create |
| `src/PriceMate.Application/DTOs/Auth/LoginRequest.cs` | create |
| `src/PriceMate.Application/DTOs/Auth/AuthResponse.cs` | create |
| `src/PriceMate.Application/DTOs/Auth/RefreshRequest.cs` | create |
| `src/PriceMate.Application/DTOs/Auth/ForgotPasswordRequest.cs` | create |
| `src/PriceMate.Application/DTOs/Auth/ResetPasswordRequest.cs` | create |
| `src/PriceMate.Application/Services/AuthService.cs` | create |

### Infrastructure Layer (create)
| File | Action |
|------|--------|
| `src/PriceMate.Infrastructure/Services/JwtTokenService.cs` | create |
| `src/PriceMate.Infrastructure/Services/BcryptPasswordHasher.cs` | create |
| `src/PriceMate.Infrastructure/Services/EmailService.cs` | create (stub) |

### API Layer (create)
| File | Action |
|------|--------|
| `src/PriceMate.API/Endpoints/AuthEndpoints.cs` | create |
| `src/PriceMate.API/Middleware/RateLimitingMiddleware.cs` | create |

### API Layer (modify)
| File | Action |
|------|--------|
| `src/PriceMate.API/Program.cs` | modify — add JWT auth, DI registrations |

## Implementation Steps

### 1. NuGet Packages
```bash
dotnet add src/PriceMate.Infrastructure package BCrypt.Net-Next
dotnet add src/PriceMate.API package Microsoft.AspNetCore.Authentication.JwtBearer
```

### 2. Application Interfaces
```csharp
// IAuthService — orchestration contract
public interface IAuthService
{
    Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken ct);
    Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken ct);
    Task<AuthResponse> RefreshTokenAsync(string refreshToken, CancellationToken ct);
    Task LogoutAsync(Guid userId, CancellationToken ct);
    Task ForgotPasswordAsync(string email, CancellationToken ct);
    Task ResetPasswordAsync(ResetPasswordRequest request, CancellationToken ct);
}

// IJwtTokenService — token generation/validation
public interface IJwtTokenService
{
    string GenerateAccessToken(User user);
    string GenerateRefreshToken();
    Guid? ValidateAccessToken(string token);
}

// IPasswordHasher — bcrypt abstraction
public interface IPasswordHasher
{
    string Hash(string password);
    bool Verify(string password, string hash);
}
```

### 3. DTOs
- `RegisterRequest`: Email, Password, DisplayName (all string, validated)
- `LoginRequest`: Email, Password
- `AuthResponse`: AccessToken, RefreshToken, User (id, email, displayName)
- `RefreshRequest`: RefreshToken
- `ForgotPasswordRequest`: Email
- `ResetPasswordRequest`: Token, NewPassword

### 4. AuthService Implementation (Application layer)
- `Register`: Validate email unique → hash password → create User → generate tokens → return AuthResponse
- `Login`: Find user by email → verify password → generate tokens → store refresh token (hashed) → return AuthResponse
- `Refresh`: Find refresh token in DB → validate not expired → revoke old → generate new pair → return
- `Logout`: Revoke all refresh tokens for user
- `ForgotPassword`: Generate reset token → store on User → send email (IEmailService)
- `ResetPassword`: Validate reset token + expiry → hash new password → update User → clear token

### 5. JwtTokenService (Infrastructure)
```csharp
public class JwtTokenService : IJwtTokenService
{
    // Access token: 15 min, claims: sub (userId), email, iat, exp
    // Refresh token: cryptographically random 64-byte base64 string
    // Signing: HMAC-SHA256 with key from config
}
```

### 6. JWT Configuration (Program.cs)
```csharp
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options => {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(keyBytes),
            ValidateIssuer = true, ValidIssuer = config["Jwt:Issuer"],
            ValidateAudience = true, ValidAudience = config["Jwt:Audience"],
            ValidateLifetime = true, ClockSkew = TimeSpan.Zero
        };
    });
builder.Services.AddAuthorization();
```

### 7. Auth Endpoints (Minimal API)
```csharp
public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/auth");

        group.MapPost("/register", async (RegisterRequest req, IAuthService auth) =>
            Results.Created("/api/auth", await auth.RegisterAsync(req, default)));

        group.MapPost("/login", async (LoginRequest req, IAuthService auth) =>
            Results.Ok(await auth.LoginAsync(req, default)));

        group.MapPost("/refresh", async (RefreshRequest req, IAuthService auth) =>
            Results.Ok(await auth.RefreshTokenAsync(req.RefreshToken, default)));

        group.MapPost("/logout", async (HttpContext ctx, IAuthService auth) => {
            var userId = Guid.Parse(ctx.User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            await auth.LogoutAsync(userId, default);
            return Results.Ok();
        }).RequireAuthorization();

        group.MapPost("/forgot-password", ...);
        group.MapPost("/reset-password", ...);
    }
}
```

### 8. Rate Limiting
```csharp
// Use built-in .NET rate limiting middleware
builder.Services.AddRateLimiter(options => {
    options.AddFixedWindowLimiter("auth", opt => {
        opt.PermitLimit = 10;
        opt.Window = TimeSpan.FromMinutes(1);
    });
});
// Apply to auth group: group.RequireRateLimiting("auth")
```

### 9. DI Registration
```csharp
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();
builder.Services.AddSingleton<IPasswordHasher, BcryptPasswordHasher>();
builder.Services.AddScoped<IEmailService, EmailService>(); // stub for now
```

### 10. App Settings
```json
{
  "Jwt": {
    "SecretKey": "min-32-char-secret-key-here-change-in-prod",
    "Issuer": "PriceMateAU",
    "Audience": "PriceMateAU",
    "AccessTokenExpiryMinutes": 15,
    "RefreshTokenExpiryDays": 7
  }
}
```

## Todo List
- [x] IAuthService, IJwtTokenService, IPasswordHasher, IEmailService interfaces
- [x] Auth DTOs (6 request/response types)
- [x] AuthService implementation in Application
- [x] JwtTokenService in Infrastructure
- [x] BcryptPasswordHasher in Infrastructure
- [x] EmailService stub in Infrastructure
- [x] JWT bearer config in Program.cs
- [x] Auth Minimal API endpoints (6 endpoints)
- [x] Rate limiting on auth group (10/min)
- [x] DI registrations for all services
- [x] appsettings.json JWT config (pre-existing)

## Success Criteria
- POST `/api/auth/register` creates user, returns tokens
- POST `/api/auth/login` returns valid JWT + refresh token
- POST `/api/auth/refresh` rotates tokens correctly
- POST `/api/auth/logout` revokes refresh tokens
- Protected endpoints return 401 without valid JWT
- Rate limiter returns 429 after 10 auth requests/min
- Passwords stored as bcrypt hashes (never plaintext)

## Risk Assessment
| Risk | Impact | Mitigation |
|------|--------|------------|
| JWT secret leaked | Critical | Use env variable, never commit; rotate keys in prod |
| Refresh token reuse attack | High | One-time use: revoke on refresh, detect reuse |
| BCrypt timing | Low | BCrypt.Net handles constant-time comparison |
