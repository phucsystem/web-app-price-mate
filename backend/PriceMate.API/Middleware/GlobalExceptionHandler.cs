using Microsoft.AspNetCore.Diagnostics;
using PriceMate.Application.DTOs.Common;

namespace PriceMate.API.Middleware;

public static class GlobalExceptionHandler
{
    public static void UseGlobalExceptionHandler(this WebApplication app)
    {
        app.UseExceptionHandler(errorApp =>
        {
            errorApp.Run(async context =>
            {
                var exception = context.Features.Get<IExceptionHandlerFeature>()?.Error;

                var (statusCode, errorCode) = exception switch
                {
                    KeyNotFoundException => (StatusCodes.Status404NotFound, "NOT_FOUND"),
                    UnauthorizedAccessException => (StatusCodes.Status401Unauthorized, "UNAUTHORIZED"),
                    ArgumentException => (StatusCodes.Status400BadRequest, "VALIDATION_ERROR"),
                    InvalidOperationException => (StatusCodes.Status409Conflict, "CONFLICT"),
                    _ => (StatusCodes.Status500InternalServerError, "INTERNAL_ERROR")
                };

                context.Response.StatusCode = statusCode;
                context.Response.ContentType = "application/json";

                await context.Response.WriteAsJsonAsync(
                    new ApiErrorResponse(new ApiError(errorCode, exception?.Message ?? "An error occurred")));
            });
        });
    }
}
