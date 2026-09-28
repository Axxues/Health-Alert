using HealthAlert.Database;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;

namespace HealthAlert.Tests;

public static class TestDb
{
    public static HealthAlertDbContext Create() =>
        new(new DbContextOptionsBuilder<HealthAlertDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);
}

// ponytail: minimal fakes so controller unit tests stay constructor-honest; add keys here, not new files
public static class TestCfg
{
    public static IConfiguration Config(string? cronKey = "dev-cron-key") =>
        new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["Cron:Key"] = cronKey })
            .Build();

    public static IHostEnvironment Env() => new FakeEnv();

    private sealed class FakeEnv : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = "Development";
        public string ApplicationName { get; set; } = "Tests";
        public string ContentRootPath { get; set; } = "";
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }
}

public class SeedTest
{
    [Fact]
    public async Task Seed_has_4_diseases_10_feeds()
    {
        var ctx = TestDb.Create();
        await Seed.RunAsync(ctx);
        Assert.Equal(4, await ctx.Diseases.CountAsync());
        Assert.Equal(10, await ctx.Feeds.CountAsync());
    }
}
