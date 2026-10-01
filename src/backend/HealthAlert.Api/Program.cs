using System.Text;
using HealthAlert.Api.Hubs;
using HealthAlert.Api.Services;
using HealthAlert.Common;
using HealthAlert.Database;
using HealthAlert.Tools;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// ponytail: fail fast when Production starts without Jwt:Key (fail-closed)
if (string.IsNullOrWhiteSpace(builder.Configuration["Jwt:Key"]) && !builder.Environment.IsDevelopment())
    throw new InvalidOperationException("Jwt:Key missing (fail-closed)");
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer();
builder.Services.AddAuthorization();
// ponytail: Configure (lazy) not AddJwtBearer-lambda — reads live config so test-host overrides apply
builder.Services.Configure<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme, o =>
    o.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = false,
        ValidateAudience = false,
        ValidateLifetime = true,
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(CronAuth.JwtKey(builder.Configuration, builder.Environment.IsDevelopment()))),
    });
builder.Services.AddControllers();
builder.Services.AddSignalR();
builder.Services.AddMemoryCache();
builder.Services.AddDbContext<HealthAlertDbContext>(o =>
{
    o.UseSqlServer(builder.Configuration.GetConnectionString("Default"));
    o.ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning));
});
builder.Services.AddScoped<SurveillanceGetTools>();
builder.Services.AddScoped<SurveillanceEditTools>();
builder.Services.AddScoped<ForecastGetTools>();
builder.Services.AddScoped<ForecastEditTools>();
builder.Services.AddScoped<ModelRegistryTools>();
builder.Services.AddScoped<RagGetTools>();
builder.Services.AddScoped<RagEditTools>();
builder.Services.AddScoped<PlaybookGetTools>();
builder.Services.AddScoped<PlaybookEditTools>();
builder.Services.AddScoped<AlertsGetTools>();
builder.Services.AddScoped<AlertsEditTools>();
builder.Services.AddScoped<RiskMapsGetTools>();
builder.Services.AddScoped<CitizenGetTools>();
builder.Services.AddScoped<ReportsGetTools>();
builder.Services.AddScoped<SystemUserGetTools>();
builder.Services.AddScoped<SystemUserEditTools>();
builder.Services.AddScoped<MessagingGetTools>();
builder.Services.AddScoped<SystemGetTools>();
builder.Services.AddHttpClient<CovariateFeedService>();
builder.Services.AddHostedService<IngestTickerService>();
var app = builder.Build();

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHub<NotificationHub>("/hubs/notification");

// ponytail: auto-migrate on boot; move to deploy step if startup time matters
using (var scope = app.Services.CreateScope())
{
    var ctx = scope.ServiceProvider.GetRequiredService<HealthAlertDbContext>();
    // ponytail: Migrate on SQL Server; EnsureCreated for InMemory test hosts
    if (ctx.Database.ProviderName == "Microsoft.EntityFrameworkCore.InMemory") await ctx.Database.EnsureCreatedAsync();
    else await ctx.Database.MigrateAsync();
    await Seed.RunAsync(ctx);
}

app.Run();

public partial class Program { }
