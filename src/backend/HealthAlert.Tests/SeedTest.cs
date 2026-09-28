using HealthAlert.Database;
using Microsoft.EntityFrameworkCore;

namespace HealthAlert.Tests;

public static class TestDb
{
    public static HealthAlertDbContext Create() =>
        new(new DbContextOptionsBuilder<HealthAlertDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);
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
