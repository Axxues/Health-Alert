using System.Text.Json;
using HealthAlert.Database;
using HealthAlert.Tools;
using Microsoft.Extensions.Caching.Memory;

namespace HealthAlert.Tests;

public class NationalScopeTest
{
    private static async Task SeedCebuAsync(HealthAlertDbContext ctx)
    {
        await Seed.RunAsync(ctx);
        var tools = new SurveillanceEditTools(ctx);
        using var doc = JsonDocument.Parse(JsonSerializer.Serialize(new { sourceKey = "Cebu|HDX-2026-W39", disease = "dengue", count = 25 }));
        var row = (TblCase)await tools.IngestAsync(DohIngestTools.Feed, doc.RootElement);
        row.ReportedAt = DateTime.UtcNow;
        await ctx.SaveChangesAsync();
    }

    private static RiskMapsGetTools Maps(HealthAlertDbContext ctx) =>
        new(ctx, new ModelRegistryTools(ctx), new MemoryCache(new MemoryCacheOptions()));

    [Fact]
    public async Task Locations_includes_harvested_cebu_with_live_counts()
    {
        var ctx = TestDb.Create();
        await SeedCebuAsync(ctx);
        var rows = await Maps(ctx).LocationsAsync(null, null, null, null, null);
        var cebu = rows.Where(r => r.Municipality == "Cebu" && r.Disease == "dengue").ToList();
        Assert.NotEmpty(cebu);
        Assert.Equal("Cebu", cebu[0].Province);
        Assert.Equal(25, cebu[0].ActiveCases);
    }

    [Fact]
    public async Task Hotspots_includes_harvested_cebu()
    {
        var ctx = TestDb.Create();
        await SeedCebuAsync(ctx);
        var spots = await Maps(ctx).Hotspots();
        var cebu = spots.FirstOrDefault(s => s.Muni == "Cebu");
        Assert.NotNull(cebu);
        Assert.Equal("Cebu", cebu.Province);
    }
}
