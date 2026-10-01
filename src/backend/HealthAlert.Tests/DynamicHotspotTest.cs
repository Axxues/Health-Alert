using HealthAlert.Database;
using HealthAlert.Tools;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace HealthAlert.Tests;

public class DynamicHotspotTest
{
    private static async Task<List<HotspotRow>> HotspotsOf(HealthAlertDbContext ctx) =>
        await new RiskMapsGetTools(ctx, new ModelRegistryTools(ctx), new MemoryCache(new MemoryCacheOptions())).Hotspots();

    [Fact]
    public async Task Surging_cases_produce_high_hotspot()
    {
        var ctx = TestDb.Create();
        await Seed.RunAsync(ctx);
        var d = await ctx.Diseases.FirstAsync(x => x.Code == "dengue");
        var t0 = DateTime.UtcNow.Date;
        for (int i = 0; i < 4; i++)
            ctx.Cases.Add(new TblCase { DiseaseId = d.Id, SourceKey = $"Agoo|s{i}", Count = 5 + i * 10, ReportedAt = t0.AddDays(-7 * (3 - i)) });
        await ctx.SaveChangesAsync();
        var spots = await HotspotsOf(ctx);
        var ago = spots.FirstOrDefault(s => s.Muni.Contains("Agoo"));
        Assert.NotNull(ago);
        Assert.Equal("high", ago.Level);
    }

    [Fact]
    public async Task Quiet_places_drop_out()
    {
        var ctx = TestDb.Create();
        await Seed.RunAsync(ctx);
        var spots = await HotspotsOf(ctx);
        Assert.Empty(spots);
    }
}
