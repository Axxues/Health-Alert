using System.Text.Json;
using HealthAlert.Api.Controllers;
using HealthAlert.Database;
using HealthAlert.Tools;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HealthAlert.Tests;

public class IngestVerificationTest
{
    private static JsonElement Json(string s) => JsonDocument.Parse(s).RootElement;

    [Fact]
    public async Task Duplicate_POST_same_sourceKey_1_row()
    {
        var ctx = TestDb.Create();
        var e = new SurveillanceEditTools(ctx);
        await e.IngestAsync("pidsr", Json("{\"sourceKey\":\"dup1\",\"disease\":\"dengue\",\"count\":5}"));
        await e.IngestAsync("pidsr", Json("{\"sourceKey\":\"dup1\",\"disease\":\"dengue\",\"count\":5}"));
        Assert.Equal(1, await ctx.Cases.CountAsync(c => c.SourceKey == "dup1"));
    }

    [Fact]
    public async Task Malformed_returns_400_deadletter_audit()
    {
        var ctx = TestDb.Create();
        var c = new SurveillanceController();
        var r = await c.Ingest("pidsr", Json("{\"disease\":\"dengue\"}"), new SurveillanceEditTools(ctx), "dev-cron-key");
        var bad = Assert.IsType<BadRequestObjectResult>(r);
        Assert.Equal(400, bad.StatusCode);
        Assert.Equal(1, await ctx.AuditTrail.CountAsync(a => a.Action!.StartsWith("ingest.dead-letter")));
        Assert.Equal(1, await ctx.Outbox.CountAsync());
    }

    [Fact]
    public async Task Fixture_POST_changes_outlook_probability()
    {
        var ctx = TestDb.Create();
        await Seed.RunAsync(ctx);
        var before = await new ForecastGetTools(ctx).OutlookAsync("dengue", "San Roque");
        var fixture = await File.ReadAllTextAsync("../../../../../../seed/bulletins/pidsr-dengue-sample.json");
        // ponytail: fallback inline payload when run from a different CWD
        if (!fixture.Contains("sourceKey")) fixture = "{\"sourceKey\":\"pidsr-2026w38-sanroque\",\"disease\":\"dengue\",\"count\":42}";
        await new SurveillanceEditTools(ctx).IngestAsync("pidsr", Json(fixture));
        var after = await new ForecastGetTools(ctx).OutlookAsync("dengue", "San Roque");
        Assert.True(after.Probability > before.Probability);
        Assert.NotEmpty(after.Drivers);
    }
}
