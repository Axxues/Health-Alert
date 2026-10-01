using HealthAlert.Database;
using Microsoft.EntityFrameworkCore;

namespace HealthAlert.Tests;

public class CovariateSeedTest
{
    [Fact]
    public async Task Seed_writes_offline_covariate_fallback()
    {
        var ctx = TestDb.Create();
        await Seed.RunAsync(ctx);
        Assert.True(await ctx.CovariateReadings.AnyAsync(c => c.Source == "seed-fallback"));
    }
}
