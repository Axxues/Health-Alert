using HealthAlert.Api.Controllers;
using HealthAlert.Common;
using HealthAlert.Database;
using HealthAlert.Tools;
using HealthAlert.Tools.ML;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace HealthAlert.Tests;

public class DemoHistoryTest
{
    [Fact]
    public async Task Seeder_is_idempotent_and_uses_ingest_path()
    {
        var ctx = TestDb.Create();
        await DemoHistorySeeder.EnsureAsync(ctx);
        var n = await ctx.Cases.CountAsync();
        Assert.True(n > 100);
        // provenance: IngestAsync stores the raw key in SourceKey and the feed code in tblFeeds
        Assert.All(await ctx.Cases.Select(c => c.SourceKey).ToListAsync(), k => Assert.Contains("|", k!));
        var feedCodes = await ctx.Cases.Join(ctx.Feeds, c => c.FeedId, f => f.Id, (c, f) => f.Code).Distinct().ToListAsync();
        Assert.Single(feedCodes, DemoHistorySeeder.Feed);
        await DemoHistorySeeder.EnsureAsync(ctx);
        Assert.Equal(n, await ctx.Cases.CountAsync());
    }

    [Fact]
    public async Task Locations_returns_rows_with_cases_and_bands()
    {
        var ctx = TestDb.Create();
        await DemoHistorySeeder.EnsureAsync(ctx);
        var c = new ForecastController(TestCfg.Config(), TestCfg.Env());
        var r = await c.Locations(null, null, null, null, null,
            new RiskMapsGetTools(ctx, new ModelRegistryTools(ctx), new MemoryCache(new MemoryCacheOptions())));
        var ok = Assert.IsType<OkObjectResult>(r);
        var rows = Assert.IsType<List<LocationRow>>(Assert.IsType<ApiResponse<List<LocationRow>>>(ok.Value).Data);
        Assert.Equal(28, rows.Count);
        Assert.All(rows, x => Assert.Contains(x.RiskLevel, new[] { "high", "moderate", "low" }));
        Assert.True(rows.Where(x => x.Disease == "dengue").Sum(x => x.ActiveCases) > 0);
    }
}
