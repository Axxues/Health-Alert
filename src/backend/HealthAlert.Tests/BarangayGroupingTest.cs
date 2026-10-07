using HealthAlert.Database;
using HealthAlert.Tools;
using HealthAlert.Tools.ML;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace HealthAlert.Tests;

public class BarangayGroupingTest
{
    private static RiskMapsGetTools Maps(HealthAlertDbContext ctx) =>
        new(ctx, new ModelRegistryTools(ctx), new MemoryCache(new MemoryCacheOptions()));

    [Fact]
    public async Task Five_part_keys_group_per_barangay()
    {
        var ctx = TestDb.Create();
        await Seed.RunAsync(ctx);
        var d = await ctx.Diseases.FirstAsync(x => x.Code == "dengue");
        var t0 = DateTime.UtcNow.Date;
        ctx.Cases.Add(new TblCase { DiseaseId = d.Id, SourceKey = "Agoo|San Nicolas|RHU|2026-W40|dengue", Count = 10, ReportedAt = t0 });
        ctx.Cases.Add(new TblCase { DiseaseId = d.Id, SourceKey = "Agoo|Poblacion|RHU|2026-W40|dengue", Count = 4, ReportedAt = t0 });
        await ctx.SaveChangesAsync();
        var rows = await Maps(ctx).LocationsAsync(null, null, "Agoo", "dengue", null);
        var mine = rows.Where(r => r.Municipality == "Agoo" && r.Disease == "dengue").ToList();
        Assert.Equal(4, mine.Count);
        Assert.Contains(mine, r => r.Barangay == "San Nicolas" && r.ActiveCases == 10);
        Assert.Contains(mine, r => r.Barangay == "Poblacion" && r.ActiveCases == 4);
        Assert.Contains(mine, r => r.Barangay == "Santa Barbara" && r.ActiveCases == 0);
        Assert.Contains(mine, r => r.Barangay == "San Antonio" && r.ActiveCases == 0);
    }

    [Fact]
    public async Task Four_part_keys_fall_back_to_directory_barangay()
    {
        var ctx = TestDb.Create();
        await Seed.RunAsync(ctx);
        var d = await ctx.Diseases.FirstAsync(x => x.Code == "dengue");
        ctx.Cases.Add(new TblCase { DiseaseId = d.Id, SourceKey = "Agoo|RHU Agoo|2026-W39|dengue", Count = 7, ReportedAt = DateTime.UtcNow.Date });
        await ctx.SaveChangesAsync();
        var spots = await Maps(ctx).Hotspots();
        var ago = spots.Where(s => s.Muni == "Agoo" && s.Disease == "dengue").ToList();
        Assert.NotNull(ago);
        var expected = DemoHistorySeeder.Places.Where(p => p.Municipality == "Agoo").Select(p => p.Barangay).ToHashSet();
        Assert.Equal(expected, ago.Select(s => s.Barangay).ToHashSet());
        Assert.Contains("\"barangay\"", System.Text.Json.JsonSerializer.Serialize(ago[0]));
    }
}
