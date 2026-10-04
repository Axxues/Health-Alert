using HealthAlert.Database;
using HealthAlert.Tools;
using HealthAlert.Tools.ML;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace HealthAlert.Tests;

public class ForecastSeriesTest
{
    private static async Task<(HealthAlertDbContext, RiskMapsGetTools)> SetupAsync()
    {
        var ctx = TestDb.Create();
        await Seed.RunAsync(ctx);
        return (ctx, new RiskMapsGetTools(ctx, new ModelRegistryTools(ctx), new MemoryCache(new MemoryCacheOptions())));
    }

    [Fact]
    public async Task Series_returns_12_past_plus_4_projected()
    {
        var (ctx, tools) = await SetupAsync();
        var did = await ctx.Diseases.Where(d => d.Code == "dengue").Select(d => d.Id).FirstAsync();
        var today = DateTime.UtcNow.Date;
        var monday = today.AddDays(-(((int)today.DayOfWeek + 6) % 7));
        for (int i = 0; i < 12; i++)
            ctx.Cases.Add(new TblCase { DiseaseId = did, SourceKey = $"Agoo|2026-W{i:D2}", Count = 5 + i, ReportedAt = monday.AddDays(-7 * (11 - i) + 2) });
        await ctx.SaveChangesAsync();
        var s = await tools.SeriesAsync("Agoo", "dengue");
        Assert.Equal(16, s.Weeks.Count);
        Assert.All(s.Weeks.Take(12), w => { Assert.False(w.IsFuture); Assert.NotNull(w.Actual); });
        Assert.All(s.Weeks.Skip(12), w => { Assert.True(w.IsFuture); Assert.Null(w.Actual); });
        Assert.All(s.Weeks, w => Assert.True(w.CiLower <= w.Predicted && w.Predicted <= w.CiUpper));
        Assert.Null(s.ModelVersion);
        Assert.Equal(12, s.HistoryLength);
    }

    [Fact]
    public async Task Unknown_disease_throws()
    {
        var (_, tools) = await SetupAsync();
        await Assert.ThrowsAsync<InvalidOperationException>(() => tools.SeriesAsync("Agoo", "ebola"));
    }
}
