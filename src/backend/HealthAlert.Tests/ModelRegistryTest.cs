using HealthAlert.Database;
using HealthAlert.Tools;
using Microsoft.EntityFrameworkCore;

namespace HealthAlert.Tests;

public class ModelRegistryTest
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
    public async Task Train_stages_challenger_with_metrics()
    {
        var ctx = TestDb.Create();
        SeedCases(ctx, "dengue", 20, i => 10 + i);
        var tools = new ModelRegistryTools(ctx);
        var m = await tools.TrainAsync("dengue");
        Assert.Equal("challenger", m.Status);
        Assert.True(m.R2 > 0.5);
        Assert.Null(await tools.DeployedAsync("dengue"));
    }

    [Fact]
    public async Task Promote_retires_previous_deployed()
    {
        var ctx = TestDb.Create();
        SeedCases(ctx, "dengue", 20, i => 10 + i);
        var tools = new ModelRegistryTools(ctx);
        var v1 = await tools.TrainAsync("dengue");
        await tools.PromoteAsync(v1.Id);
        var v2 = await tools.TrainAsync("dengue");
        await tools.PromoteAsync(v2.Id);
        Assert.Equal("retired", (await ctx.ForecastModels.FindAsync(v1.Id))!.Status);
        Assert.Equal(v2.Id, (await tools.DeployedAsync("dengue"))!.Id);
    }
}
