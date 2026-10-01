using System.Globalization;
using System.Text.Json;
using HealthAlert.Database;
using Microsoft.EntityFrameworkCore;

namespace HealthAlert.Tools;

public static class DohIngestTools
{
    public const string Feed = "hdx-doh-epi";
    // ponytail: URLs resolved 2026-10-01 via package_search?q=dengue philippines (keyless); re-resolve if HDX rotates resource ids
    public const string HdxPackageUrl = "https://data.humdata.org/api/3/action/package_show?id=philippine-dengue-cases-and-deaths";
    public const string HdxResourceUrl = "https://data.humdata.org/dataset/ac63a95e-7296-42fb-802b-7f7541c73e45/resource/9e839677-3ff0-44b3-992c-1a99e68df515/download/doh-epi-dengue-data-2016-2021.csv";

    public static List<(string Province, string Region, DateTime Week, double Cases)> ParseHdxCsv(string csv)
    {
        var rows = new List<(string Province, string Region, DateTime Week, double Cases)>();
        var lines = csv.Split(['\r', '\n'], StringSplitOptions.RemoveEmptyEntries);
        foreach (var raw in lines.Skip(1))
        {
            var line = raw.Trim();
            if (line.Length == 0 || line.StartsWith('#')) continue; // ponytail: skip HXL tag row; naive split (no quoted commas in HDX dengue CSV)
            var cols = line.Split(',');
            if (cols.Length < 5) continue;
            var province = cols[0].Trim();
            if (!double.TryParse(cols[1].Trim(), NumberStyles.Any, CultureInfo.InvariantCulture, out var cases)) continue;
            if (!DateTime.TryParse(cols[3].Trim(), CultureInfo.InvariantCulture, DateTimeStyles.None, out var date)) continue;
            var monday = date.AddDays(-(((int)date.DayOfWeek + 6) % 7)).Date;
            rows.Add((province, cols[4].Trim(), monday, cases));
        }
        return rows;
    }

    public static async Task<int> BackfillHdxAsync(HealthAlertDbContext ctx, HttpClient http, CancellationToken ct)
    {
        var csv = await http.GetStringAsync(HdxResourceUrl, ct);
        var rows = ParseHdxCsv(csv);
        var seen = new HashSet<string>(await ctx.Cases
            .Where(c => c.SourceKey != null && c.SourceKey.Contains("|HDX-"))
            .Select(c => c.SourceKey!).ToListAsync(ct));
        var tools = new SurveillanceEditTools(ctx);
        var written = 0;
        foreach (var r in rows)
        {
            var week = ISOWeek.GetWeekOfYear(r.Week);
            var key = $"{r.Province}|HDX-{r.Week.Year}-W{week:D2}";
            if (!seen.Add(key)) continue;
            using var doc = JsonDocument.Parse(JsonSerializer.Serialize(new { sourceKey = key, disease = "dengue", count = r.Cases }));
            var row = (TblCase)await tools.IngestAsync(Feed, doc.RootElement);
            row.ReportedAt = r.Week;
            written++;
        }
        await ctx.SaveChangesAsync(ct);
        return written;
    }
}
