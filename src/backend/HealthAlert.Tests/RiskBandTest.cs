using HealthAlert.Database;
using HealthAlert.Tools;
using Microsoft.EntityFrameworkCore;

namespace HealthAlert.Tests;

public class RiskBandTest
{
    [Fact]
    public void High_probability_wins_over_quiet_covariates()
    {
        var t = RiskBandTools.DefaultFor("dengue");
        Assert.Equal("high", RiskBandTools.Assign(0.85, 1.0, 5.0, t));
    }

    [Fact]
    public void Breteau_over_threshold_forces_high()
    {
        var t = RiskBandTools.DefaultFor("dengue");
        Assert.Equal("high", RiskBandTools.Assign(0.1, 1.0, 24.5, t));
    }

    [Fact]
    public void Quiet_signals_stay_routine()
    {
        var t = RiskBandTools.DefaultFor("dengue");
        Assert.Equal("low", RiskBandTools.Assign(0.1, 1.0, 5.0, t));
    }

    [Fact]
    public async Task Seed_writes_default_thresholds()
    {
        var ctx = TestDb.Create();
        await Seed.RunAsync(ctx);
        Assert.True(await ctx.RiskThresholds.AnyAsync(t => t.Disease == "dengue"));
    }
}
