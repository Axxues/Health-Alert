using HealthAlert.Api.Controllers;
using HealthAlert.Common;
using HealthAlert.Database;
using HealthAlert.Tools.ML;
using Microsoft.AspNetCore.Mvc;

namespace HealthAlert.Tests;

public class BaselineBacktestTest
{
    private static void SeedCases(HealthAlertDbContext ctx, string disease, int weeks, Func<int, double> fn)
    {
        var d = new TblDisease { Code = disease, Category = "test" };
        ctx.Diseases.Add(d); ctx.SaveChanges();
        var t0 = new DateTime(2026, 1, 5);
        for (int i = 0; i < weeks; i++)
            ctx.Cases.Add(new TblCase { DiseaseId = d.Id, Count = fn(i), ReportedAt = t0.AddDays(7 * i) });
        ctx.SaveChanges();
    }

    [Fact]
    public void SeasonalNaive_beats_persistence_on_periodic_data()
    {
        var y = Enumerable.Range(0, 120).Select(i => 10 + 5 * Math.Sin(2 * Math.PI * i / 52)).ToArray();
        var (pRmse, _, _) = RidgeRegression.BaselineMetrics(y, seasonal: false);
        var (sRmse, _, _) = RidgeRegression.BaselineMetrics(y, seasonal: true);
        Assert.True(sRmse < pRmse);
    }

    [Fact]
    public void SeasonalNaive_falls_back_to_persistence_on_short_history()
    {
        var y = Enumerable.Range(0, 20).Select(i => 10.0 + i).ToArray();
        var p = RidgeRegression.BaselineMetrics(y, seasonal: false);
        var s = RidgeRegression.BaselineMetrics(y, seasonal: true);
        Assert.Equal(p.Rmse, s.Rmse);
        Assert.Equal(p.Mae, s.Mae);
    }

    [Fact]
    public async Task Train_stores_best_baseline()
    {
        var ctx = TestDb.Create();
        SeedCases(ctx, "dengue", 20, i => 10 + i);
        var m = await new ModelRegistryTools(ctx).TrainAsync("dengue");
        Assert.NotNull(m.BaselineName);
        Assert.Contains(m.BaselineName, new[] { "persistence", "seasonal-naive-52" });
        Assert.True(double.IsFinite(m.BaselineRmse ?? double.NaN) && double.IsFinite(m.BaselineMae ?? double.NaN));
    }

    [Fact]
    public async Task Backtest_endpoint_returns_all_three_blocks()
    {
        var ctx = TestDb.Create();
        SeedCases(ctx, "dengue", 20, i => 10 + i);
        var reg = new ModelRegistryTools(ctx);
        await reg.TrainAsync("dengue");
        var c = new ForecastController(TestCfg.Config(), TestCfg.Env());
        var r = await c.Backtest("dengue", reg);
        var ok = Assert.IsType<OkObjectResult>(r);
        var bt = Assert.IsType<BacktestResult>(Assert.IsType<ApiResponse<BacktestResult>>(ok.Value).Data);
        Assert.Equal(20, bt.HistoryLength);
        Assert.True(double.IsFinite(bt.Ridge.Rmse) && double.IsFinite(bt.Persistence.Rmse) && double.IsFinite(bt.SeasonalNaive.Rmse));
        Assert.NotNull(bt.DataSources);
    }
}
