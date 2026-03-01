using System.Text;
using HealthChecks.NpgSql;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using PriceMate.Application.Interfaces;
using PriceMate.Application.Services;
using PriceMate.Domain.Interfaces;
using PriceMate.Infrastructure.BackgroundJobs;
using PriceMate.Infrastructure.ExternalApis;
using PriceMate.Infrastructure.Persistence;
using PriceMate.Infrastructure.Persistence.Repositories;
using PriceMate.Infrastructure.Services;
using PriceMate.API.Endpoints;
using PriceMate.API.Middleware;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? new[] { "http://localhost:3000" };

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy.WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

builder.Services.AddHealthChecks()
    .AddNpgSql(connectionString);

builder.Services.AddDbContextPool<ApplicationDbContext>(options =>
    options.UseNpgsql(connectionString, npgsql =>
    {
        npgsql.EnableRetryOnFailure(maxRetryCount: 3);
        npgsql.CommandTimeout(30);
    }));

builder.Services.AddScoped<IUnitOfWork>(sp => sp.GetRequiredService<ApplicationDbContext>());
builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
builder.Services.AddScoped<IApplicationDbContext>(sp => sp.GetRequiredService<ApplicationDbContext>());

// Amazon PA API
var amazonConfig = new AmazonApiConfig(
    AccessKey: builder.Configuration["Amazon:AccessKey"] ?? string.Empty,
    SecretKey: builder.Configuration["Amazon:SecretKey"] ?? string.Empty,
    PartnerId: builder.Configuration["Amazon:PartnerId"] ?? "pricemate-au-20",
    Host: builder.Configuration["Amazon:Host"] ?? "webservices.amazon.com.au",
    Region: builder.Configuration["Amazon:Region"] ?? "us-west-2"
);
builder.Services.AddSingleton(amazonConfig);
builder.Services.AddSingleton<AwsSigV4Signer>();
builder.Services.AddHttpClient<IAmazonProductService, AmazonProductService>();

// Email (SES with stub fallback via UseSes flag)
var sesConfig = new SesConfig(
    AccessKey: builder.Configuration["Ses:AccessKey"] ?? string.Empty,
    SecretKey: builder.Configuration["Ses:SecretKey"] ?? string.Empty,
    SenderEmail: builder.Configuration["Ses:SenderEmail"] ?? "alerts@pricemate.com.au",
    Region: builder.Configuration["Ses:Region"] ?? "ap-southeast-2",
    UseSes: builder.Configuration.GetValue<bool>("Ses:UseSes")
);
builder.Services.AddSingleton(sesConfig);
builder.Services.AddScoped<IEmailService, SesEmailService>();

// Auth services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();
builder.Services.AddSingleton<IPasswordHasher, BcryptPasswordHasher>();

// Alert checker
builder.Services.AddScoped<IAlertCheckerService, AlertCheckerService>();

// Background services
builder.Services.AddHostedService<PriceFetchingService>();
builder.Services.AddHostedService<TokenCleanupService>();

// Product & catalog services
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();
builder.Services.AddScoped<ITrackedItemService, TrackedItemService>();
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<IDealService, DealService>();

// JWT Bearer authentication
var jwtKey = builder.Configuration["Jwt:SecretKey"]
    ?? throw new InvalidOperationException("Jwt:SecretKey not configured.");
var keyBytes = Encoding.UTF8.GetBytes(jwtKey);

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(keyBytes),
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidateAudience = true,
            ValidAudience = builder.Configuration["Jwt:Audience"],
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("auth", limiterOptions =>
    {
        limiterOptions.PermitLimit = 10;
        limiterOptions.Window = TimeSpan.FromMinutes(1);
        limiterOptions.QueueLimit = 0;
    });
    options.AddFixedWindowLimiter("search", limiterOptions =>
    {
        limiterOptions.PermitLimit = 30;
        limiterOptions.Window = TimeSpan.FromMinutes(1);
        limiterOptions.QueueLimit = 0;
    });
    options.AddFixedWindowLimiter("track-url", limiterOptions =>
    {
        limiterOptions.PermitLimit = 10;
        limiterOptions.Window = TimeSpan.FromMinutes(1);
        limiterOptions.QueueLimit = 0;
    });
    options.AddFixedWindowLimiter("general", limiterOptions =>
    {
        limiterOptions.PermitLimit = 60;
        limiterOptions.Window = TimeSpan.FromMinutes(1);
        limiterOptions.QueueLimit = 0;
    });
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    await dbContext.Database.MigrateAsync();
    await SeedData.SeedAsync(dbContext);
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseGlobalExceptionHandler();
app.UseCors("Frontend");
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();

app.MapHealthChecks("/health");
app.MapAuthEndpoints();
app.MapProductEndpoints();
app.MapDashboardEndpoints();
app.MapTrackedItemEndpoints();
app.MapCategoryEndpoints();
app.MapDealEndpoints();

app.Run();
