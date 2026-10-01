using HealthAlert.Database;
using HealthAlert.Tools;
using Microsoft.EntityFrameworkCore;

namespace HealthAlert.Tests;

public class ReportsQueryTest
{
    [Fact]
    public async Task Bulletin_sums_two_weeks_per_disease()
    {
        var ctx = TestDb.Create();
        await Seed.RunAsync(ctx);
        var d = await ctx.Diseases.FirstAsync(x => x.Code == "dengue");
        var monday = new DateTime(2026, 9, 28);
        ctx.Cases.Add(new TblCase { DiseaseId = d.Id, SourceKey = "Agoo|a1", Count = 10, ReportedAt = monday });
        ctx.Cases.Add(new TblCase { DiseaseId = d.Id, SourceKey = "Agoo|a2", Count = 6, ReportedAt = monday.AddDays(-7) });
        await ctx.SaveChangesAsync();
        var b = await new ReportsGetTools(ctx).BulletinAsync(monday);
        var row = b.Diseases.First(r => r.Disease == "dengue");
        Assert.Equal(10, row.Cases);
        Assert.Equal(6, row.PrevCases);
    }

    [Fact]
    public async Task Export_filters_by_place_and_range()
    {
        var ctx = TestDb.Create();
        await Seed.RunAsync(ctx);
        var d = await ctx.Diseases.FirstAsync(x => x.Code == "dengue");
        ctx.Cases.Add(new TblCase { DiseaseId = d.Id, SourceKey = "Agoo|a1", Count = 4, ReportedAt = new DateTime(2026, 9, 28) });
        ctx.Cases.Add(new TblCase { DiseaseId = d.Id, SourceKey = "Bauang|b1", Count = 9, ReportedAt = new DateTime(2026, 9, 28) });
        await ctx.SaveChangesAsync();
        var rows = await new ReportsGetTools(ctx).ExportAsync("Agoo", "dengue", new DateTime(2026, 9, 21), new DateTime(2026, 10, 5));
        Assert.Single(rows);
        Assert.Equal("Agoo", rows[0].Muni);
    }
}
