using HealthAlert.Database;
using HealthAlert.Tools;
using Microsoft.EntityFrameworkCore;

namespace HealthAlert.Tests;

public class AlertEngineTest
{
    [Fact]
    public async Task First_high_opens_one_alert()
    {
        var ctx = TestDb.Create();
        var rep = await new AlertEngineTools(ctx).EvaluateAsync([("Agoo", "dengue", "high")]);
        Assert.Equal(1, rep.Opened);
        Assert.Equal(1, await ctx.Alerts.CountAsync(a => a.Status == "new"));
    }

    [Fact]
    public async Task Sustained_high_does_not_duplicate()
    {
        var ctx = TestDb.Create();
        var eng = new AlertEngineTools(ctx);
        await eng.EvaluateAsync([("Agoo", "dengue", "high")]);
        var rep = await eng.EvaluateAsync([("Agoo", "dengue", "high")]);
        Assert.Equal(0, rep.Opened);
        Assert.Equal(1, await ctx.Alerts.CountAsync(a => a.Status == "new"));
    }

    [Fact]
    public async Task Downgrade_resolves_open_alert()
    {
        var ctx = TestDb.Create();
        var eng = new AlertEngineTools(ctx);
        await eng.EvaluateAsync([("Agoo", "dengue", "high")]);
        var rep = await eng.EvaluateAsync([("Agoo", "dengue", "moderate")]);
        Assert.Equal(1, rep.Resolved);
        Assert.Equal(0, await ctx.Alerts.CountAsync(a => a.Status == "new"));
    }
}
