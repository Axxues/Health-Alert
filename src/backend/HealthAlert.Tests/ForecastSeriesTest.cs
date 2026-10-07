using System.Text.Json;
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
        Assert.Null(s.Metrics);
        Assert.NotNull(s.Covariates);
        Assert.Equal(112.5, s.Covariates.RainMm); // seed-fallback payload
    }

    [Fact]
    public async Task Series_metrics_present_after_train_and_promote()
    {
        var (ctx, tools) = await SetupAsync();
        var did = await ctx.Diseases.Where(d => d.Code == "dengue").Select(d => d.Id).FirstAsync();
        var today = DateTime.UtcNow.Date;
        var monday = today.AddDays(-(((int)today.DayOfWeek + 6) % 7));
        for (int i = 0; i < 12; i++)
            ctx.Cases.Add(new TblCase { DiseaseId = did, SourceKey = $"Agoo|2026-W{i:D2}", Count = 5 + i, ReportedAt = monday.AddDays(-7 * (11 - i) + 2) });
        await ctx.SaveChangesAsync();
        var reg = new ModelRegistryTools(ctx);
        var m = await reg.TrainAsync("dengue");
        await reg.PromoteAsync(m.Id);
        var s = await tools.SeriesAsync("Agoo", "dengue");
        Assert.NotNull(s.Metrics);
        Assert.Equal($"Ridge regressor v{m.Version} (dengue walk-forward)", s.Metrics.ModelName);
        Assert.Equal(m.Version, s.Metrics.Version);
        Assert.Equal(m.Rmse ?? 0, s.Metrics.Rmse);
        Assert.Equal(m.Mae ?? 0, s.Metrics.Mae);
        Assert.Equal(m.R2 ?? 0, s.Metrics.R2);
        Assert.Equal(m.BaselineName, s.Metrics.BaselineName);
        Assert.Equal(m.BaselineRmse ?? 0, s.Metrics.BaselineRmse);
        var t = await ctx.RiskThresholds.FirstAsync(t => t.Disease == "dengue");
        Assert.Equal(t.Method, s.Metrics.Method);
        Assert.Equal(t.Citation, s.Metrics.Citation);
        var json = JsonSerializer.Serialize(s);
        foreach (var k in new[] { "\"metrics\"", "\"modelName\"", "\"version\"", "\"rmse\"", "\"mae\"", "\"r2\"", "\"baselineName\"", "\"baselineRmse\"", "\"method\"", "\"citation\"", "\"covariates\"", "\"rainMm\"", "\"tempC\"", "\"aqi\"", "\"pageviews\"", "\"date\"" })
            Assert.Contains(k, json);
    }

    [Fact]
    public async Task Series_covariates_null_without_readings_then_newest_per_key()
    {
        var (ctx, tools) = await SetupAsync();
        ctx.CovariateReadings.RemoveRange(ctx.CovariateReadings);
        await ctx.SaveChangesAsync();
        Assert.Null((await tools.SeriesAsync("Agoo", "dengue")).Covariates);
        ctx.CovariateReadings.Add(new TblCovariateReading { Place = "Agoo", Date = new DateTime(2026, 10, 2), Source = "test", Payload = "{\"rainMm\":10.5,\"tempC\":29.0,\"aqi\":55,\"pageviews\":999}" });
        await ctx.SaveChangesAsync();
        var s = await tools.SeriesAsync("Agoo", "dengue");
        Assert.NotNull(s.Covariates);
        Assert.Equal(10.5, s.Covariates.RainMm);
        Assert.Equal(29.0, s.Covariates.TempC);
        Assert.Equal(55, s.Covariates.Aqi);
        Assert.Equal(999, s.Covariates.Pageviews);
        Assert.Equal(new DateTime(2026, 10, 2), s.Covariates.Date);
        ctx.CovariateReadings.Add(new TblCovariateReading { Place = "Agoo", Date = new DateTime(2026, 10, 3), Source = "test", Payload = "{\"tempC\":30.0}" });
        await ctx.SaveChangesAsync();
        var s2 = await tools.SeriesAsync("Agoo", "dengue");
        Assert.NotNull(s2.Covariates);
        Assert.Equal(10.5, s2.Covariates.RainMm);
        Assert.Equal(30.0, s2.Covariates.TempC);
        Assert.Equal(new DateTime(2026, 10, 3), s2.Covariates.Date);
    }

    [Fact]
    public async Task Locations_rows_carry_directory_coordinates()
    {
        var (_, tools) = await SetupAsync();
        var rows = await tools.LocationsAsync(null, null, null, null, null);
        var agoo = rows.Where(r => r.Municipality == "Agoo" && r.Disease == "dengue").ToList();
        Assert.NotEmpty(agoo);
        Assert.All(agoo, r =>
        {
            var dir = DemoHistorySeeder.Places.First(p => p.Municipality == "Agoo" && p.Barangay == r.Barangay);
            Assert.Equal(dir.Lat, r.Lat);
            Assert.Equal(dir.Lng, r.Lng);
            Assert.Contains("\"lat\"", JsonSerializer.Serialize(r));
            Assert.Contains("\"lng\"", JsonSerializer.Serialize(r));
        });
        var sanNicolas = Assert.Single(agoo, r => r.Barangay == "San Nicolas");
        Assert.Equal(16.3217, sanNicolas.Lat);
        Assert.Equal(120.3647, sanNicolas.Lng);
    }

    [Fact]
    public async Task Series_barangay_filter_sums_only_matching_barangay()
    {
        var (ctx, tools) = await SetupAsync();
        var did = await ctx.Diseases.Where(d => d.Code == "dengue").Select(d => d.Id).FirstAsync();
        var today = DateTime.UtcNow.Date;
        var monday = today.AddDays(-(((int)today.DayOfWeek + 6) % 7));
        for (int i = 0; i < 3; i++)
        {
            var weekStart = monday.AddDays(-7 * (2 - i));
            ctx.Cases.Add(new TblCase { DiseaseId = did, SourceKey = $"Agoo|San Nicolas|RHU|2026-W3{8 + i}|dengue", Count = 4, ReportedAt = weekStart });
            ctx.Cases.Add(new TblCase { DiseaseId = did, SourceKey = $"Agoo|Poblacion|RHU|2026-W3{8 + i}|dengue", Count = 6, ReportedAt = weekStart });
        }
        await ctx.SaveChangesAsync();
        var filtered = await tools.SeriesAsync("Agoo", "dengue", "San Nicolas");
        var all = await tools.SeriesAsync("Agoo", "dengue");
        Assert.Equal(12, filtered.Weeks.Where(w => !w.IsFuture).Sum(w => w.Actual ?? 0));
        Assert.Equal(30, all.Weeks.Where(w => !w.IsFuture).Sum(w => w.Actual ?? 0));
    }

    [Fact]
    public async Task Unknown_disease_throws()
    {
        var (_, tools) = await SetupAsync();
        await Assert.ThrowsAsync<InvalidOperationException>(() => tools.SeriesAsync("Agoo", "ebola"));
    }
}
