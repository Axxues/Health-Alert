using Microsoft.Extensions.Configuration;

namespace HealthAlert.Common;

// ponytail: dev defaults live here only; Production unset => null => controllers fail closed (500)
public static class CronAuth
{
    public const string Header = "X-Cron-Key";
    public const string DevKey = "dev-cron-key";
    public const string DevJwtKey = "dev-jwt-key-change-me-in-prod-32ch";

    public static string? Expected(IConfiguration cfg, bool isDevelopment) =>
        string.IsNullOrWhiteSpace(cfg["Cron:Key"])
            ? (isDevelopment ? DevKey : null)
            : cfg["Cron:Key"];

    public static string JwtKey(IConfiguration cfg, bool isDevelopment) =>
        cfg["Jwt:Key"] ?? (isDevelopment ? DevJwtKey : null)
            ?? throw new InvalidOperationException("Jwt:Key missing (fail-closed)");
}
