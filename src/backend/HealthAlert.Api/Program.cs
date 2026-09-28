using HealthAlert.Database;
using HealthAlert.Tools;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllers();
builder.Services.AddDbContext<HealthAlertDbContext>(o =>
    o.UseSqlServer(builder.Configuration.GetConnectionString("Default")));
builder.Services.AddScoped<SurveillanceGetTools>();
builder.Services.AddScoped<SurveillanceEditTools>();
var app = builder.Build();

app.MapControllers();

// ponytail: auto-migrate on boot; move to deploy step if startup time matters
using (var scope = app.Services.CreateScope())
{
    var ctx = scope.ServiceProvider.GetRequiredService<HealthAlertDbContext>();
    await ctx.Database.MigrateAsync();
    await Seed.RunAsync(ctx);
}

app.Run();
