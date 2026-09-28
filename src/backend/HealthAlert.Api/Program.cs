using HealthAlert.Api.Hubs;
using HealthAlert.Database;
using HealthAlert.Tools;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllers();
builder.Services.AddSignalR();
builder.Services.AddDbContext<HealthAlertDbContext>(o =>
    o.UseSqlServer(builder.Configuration.GetConnectionString("Default")));
builder.Services.AddScoped<SurveillanceGetTools>();
builder.Services.AddScoped<SurveillanceEditTools>();
builder.Services.AddScoped<ForecastGetTools>();
builder.Services.AddScoped<ForecastEditTools>();
builder.Services.AddScoped<RagTools>();
builder.Services.AddScoped<PlaybookTools>();
builder.Services.AddScoped<AlertsTools>();
var app = builder.Build();

app.MapControllers();
app.MapHub<NotificationHub>("/hubs/notification");

// ponytail: auto-migrate on boot; move to deploy step if startup time matters
using (var scope = app.Services.CreateScope())
{
    var ctx = scope.ServiceProvider.GetRequiredService<HealthAlertDbContext>();
    await ctx.Database.MigrateAsync();
    await Seed.RunAsync(ctx);
}

app.Run();
