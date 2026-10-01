using HealthAlert.Database;
using Microsoft.EntityFrameworkCore;

namespace HealthAlert.Tools;

public record DiseaseRow(string Disease, double Cases, double PrevCases, double ChangePct);
public record WeeklyBulletin(string Week, List<DiseaseRow> Diseases, List<string> Hotspots, List<string> ActiveAlerts);
public record CaseExportRow(DateTime Date, string Muni, string Disease, double Count);

public class ReportsGetTools(HealthAlertDbContext ctx)
{
    public object Surveillance() => new
    {
        week = "2026-W39", dengue = 42, leptospirosis = 7, ili = 130, asthma = 25,
    };

    public async Task<WeeklyBulletin> BulletinAsync(DateTime weekStart)
    {
        var weekEnd = weekStart.AddDays(7);
        var prevStart = weekStart.AddDays(-7);
        var diseases = await ctx.Diseases.OrderBy(d => d.Id).ToListAsync();
        var rows = new List<DiseaseRow>();
        foreach (var d in diseases)
        {
            var cur = await ctx.Cases
                .Where(c => c.DiseaseId == d.Id && c.ReportedAt >= weekStart && c.ReportedAt < weekEnd)
                .SumAsync(c => c.Count ?? 0);
            var prev = await ctx.Cases
                .Where(c => c.DiseaseId == d.Id && c.ReportedAt >= prevStart && c.ReportedAt < weekStart)
                .SumAsync(c => c.Count ?? 0);
            var pct = prev == 0 ? 0 : (cur - prev) / prev * 100;
            rows.Add(new DiseaseRow(d.Code ?? "", cur, prev, pct));
        }
        var open = await ctx.Alerts
            .Where(a => a.Status == "new" || a.Status == "acked")
            .ToListAsync();
        var hotspots = open
            .Select(a => a.Muni == null ? (a.Message ?? "") : $"{a.Muni} ({a.Disease})")
            .Where(s => s != "")
            .Distinct()
            .ToList();
        var active = await ctx.Alerts
            .Where(a => a.Status == "new" && a.Message != null)
            .Select(a => a.Message!)
            .ToListAsync();
        return new WeeklyBulletin(weekStart.ToString("yyyy-MM-dd"), rows, hotspots, active);
    }

    public async Task<List<CaseExportRow>> ExportAsync(string? muni, string? disease, DateTime from, DateTime to)
    {
        var cases = await ctx.Cases
            .Where(c => c.ReportedAt >= from && c.ReportedAt < to)
            .ToListAsync();
        var codes = await ctx.Diseases.ToDictionaryAsync(d => d.Id, d => d.Code ?? "");
        var rows = cases
            .Select(c => new CaseExportRow(
                c.ReportedAt ?? DateTime.MinValue,
                MuniOf(c.SourceKey),
                c.DiseaseId.HasValue && codes.TryGetValue(c.DiseaseId.Value, out var code) ? code : "",
                c.Count ?? 0))
            .Where(r => (muni == null || r.Muni == muni) && (disease == null || disease == "all" || r.Disease == disease))
            .OrderBy(r => r.Date)
            .ToList();
        return rows;
    }

    private static string MuniOf(string? key)
    {
        if (key == null) return "";
        var i = key.IndexOf('|');
        return i < 0 ? "" : key[..i];
    }
}
