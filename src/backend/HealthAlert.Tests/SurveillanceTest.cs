using System.Text.Json;
using HealthAlert.Api.Controllers;
using HealthAlert.Database;
using HealthAlert.Tools;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HealthAlert.Tests;

public class SurveillanceTest
{
    private static JsonElement Json(string s) => JsonDocument.Parse(s).RootElement;

    [Fact]
    public async Task Ingest_is_idempotent()
    {
        var ctx = TestDb.Create();
        var e = new SurveillanceEditTools(ctx);
        await e.IngestAsync("weather", Json("{\"sourceKey\":\"k1\"}"));
        await e.IngestAsync("weather", Json("{\"sourceKey\":\"k1\"}"));
        Assert.Equal(1, await ctx.Cases.CountAsync(c => c.SourceKey == "k1"));
    }

    [Fact]
    public async Task Feeds_returns_10()
    {
        var ctx = TestDb.Create();
        await Seed.RunAsync(ctx);
        Assert.Equal(10, (await new SurveillanceGetTools(ctx).FeedsAsync()).Count);
    }

    [Fact]
    public async Task Ingest_rejects_bad_cron_key()
    {
        var ctx = TestDb.Create();
        var c = new SurveillanceController(TestCfg.Config(), TestCfg.Env());
        var r = await c.Ingest("weather", Json("{\"sourceKey\":\"k2\"}"), new SurveillanceEditTools(ctx), "wrong");
        Assert.IsType<UnauthorizedResult>(r);
    }
}
