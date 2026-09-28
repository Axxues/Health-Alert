using HealthAlert.Database;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddDbContext<HealthAlertDbContext>(o =>
    o.UseSqlServer(builder.Configuration.GetConnectionString("Default")));
var app = builder.Build();

app.MapGet("/", () => "Hello World!");

// ponytail: auto-migrate on boot; move to deploy step if startup time matters
using (var scope = app.Services.CreateScope())
{
    var ctx = scope.ServiceProvider.GetRequiredService<HealthAlertDbContext>();
    await ctx.Database.MigrateAsync();
    await Seed.RunAsync(ctx);
}

app.Run();
