using HealthAlert.Database;
using HealthAlert.Tools;
using Microsoft.EntityFrameworkCore;

namespace HealthAlert.Tests;

public class ModelServeTest
{
    [Fact]
    public async Task Outlook_uses_deployed_model_when_present()
    {
        var ctx = TestDb.Create();
        await Seed.RunAsync(ctx);
        var counts = new double[] { 10, 12, 11, 13, 15, 14, 16, 18, 17, 19, 21, 20, 22, 24 };
        var d = await ctx.Diseases.FirstAsync(x => x.Code == "dengue");
        var t0 = new DateTime(2026, 1, 5);
        for (int i = 0; i < counts.Length; i++)
            ctx.Cases.Add(new TblCase { DiseaseId = d.Id, Count = counts[i], ReportedAt = t0.AddDays(7 * i) });
        await ctx.SaveChangesAsync();
        var reg = new ModelRegistryTools(ctx);
        await reg.PromoteAsync((await reg.TrainAsync("dengue")).Id);
        var o = await new ForecastGetTools(ctx, reg).OutlookAsync("dengue", "Agoo");
        Assert.True(o.Probability > 0 && o.Probability <= 0.97);
        Assert.Contains("fitted-model", o.Drivers);
    }
}
