using System.Globalization;
using System.Text.Json;
using System.Text.RegularExpressions;
using HealthAlert.Database;
using Microsoft.EntityFrameworkCore;

namespace HealthAlert.Tools;

public record WdsrFinding(string Title, string Url, DateTime? SeenAt);

public static class DohIngestTools
{
    public const string Feed = "hdx-doh-epi";
    // ponytail: URLs resolved 2026-10-01 via package_search?q=dengue philippines (keyless); re-resolve if HDX rotates resource ids
    public const string HdxPackageUrl = "https://data.humdata.org/api/3/action/package_show?id=philippine-dengue-cases-and-deaths";
    public const string HdxResourceUrl = "https://data.humdata.org/dataset/ac63a95e-7296-42fb-802b-7f7541c73e45/resource/9e839677-3ff0-44b3-992c-1a99e68df515/download/doh-epi-dengue-data-2016-2021.csv";
    public const string WdsrFeed = "doh-wdsr";
    public const string WdsrUrl = "https://doh.gov.ph/health-statistics/weekly-disease-surveillance-report";

    private static readonly string[] TrackedDiseases = ["dengue", "leptospirosis", "ili", "asthma"];

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

    public static List<WdsrFinding> ParseWdsrListings(string html, string baseUrl)
    {
        var findings = new List<WdsrFinding>();
        foreach (Match m in Regex.Matches(html, @"<a\s[^>]*href\s*=\s*[""']([^""']+)[""'][^>]*>(.*?)</a\s*>", RegexOptions.IgnoreCase | RegexOptions.Singleline))
        {
            var href = System.Net.WebUtility.HtmlDecode(m.Groups[1].Value.Trim());
            if (!href.Contains("surveillance", StringComparison.OrdinalIgnoreCase)
                && !href.Contains("wdsr", StringComparison.OrdinalIgnoreCase)
                && !href.Contains("weekly", StringComparison.OrdinalIgnoreCase)) continue;
            var title = System.Net.WebUtility.HtmlDecode(Regex.Replace(m.Groups[2].Value, "<.*?>", "")).Trim();
            try { findings.Add(new WdsrFinding(title, new Uri(new Uri(baseUrl), href).ToString(), null)); } // ponytail: SeenAt null; parse dates if ticker needs freshness
            catch { Console.Error.WriteLine($"warn: skipping unresolvable WDSR link {href}"); }
        }
        return findings;
    }

    public static List<(string Province, string Disease, double Cases)> ParseWdsrTables(string html)
    {
        var rows = new List<(string Province, string Disease, double Cases)>();
        foreach (Match table in Regex.Matches(html, @"<table.*?>.*?</table\s*>", RegexOptions.IgnoreCase | RegexOptions.Singleline))
        {
            var trs = Regex.Matches(table.Value, @"<tr.*?>.*?</tr\s*>", RegexOptions.IgnoreCase | RegexOptions.Singleline);
            if (trs.Count < 2) { Console.Error.WriteLine("warn: skipping WDSR table with no data rows"); continue; }
            List<string> Cells(Match tr) => Regex.Matches(tr.Value, @"<t[hd].*?>(.*?)</t[hd]\s*>", RegexOptions.IgnoreCase | RegexOptions.Singleline)
                .Select(c => System.Net.WebUtility.HtmlDecode(Regex.Replace(c.Groups[1].Value, "<.*?>", "")).Trim()).ToList();
            var headers = Cells(trs[0]).Select(h => h.ToLowerInvariant()).ToList();
            var placeIdx = headers.FindIndex(h => h.Contains("province") || h.Contains("region") || h.Contains("municipal") || h.Contains("location") || h.Contains("area") || h.Contains("place"));
            if (placeIdx < 0) { Console.Error.WriteLine("warn: skipping WDSR table with no place column"); continue; }
            var diseaseCols = TrackedDiseases.Where(d => headers.FindIndex(h => h.Contains(d)) >= 0).ToList();
            if (diseaseCols.Count == 0) { Console.Error.WriteLine("warn: skipping WDSR table with no tracked disease header"); continue; }
            foreach (var tr in trs.Skip(1))
            {
                var cells = Cells(tr);
                if (cells.Count <= placeIdx) { Console.Error.WriteLine("warn: skipping short WDSR row"); continue; }
                var place = cells[placeIdx].Trim();
                if (place.Length == 0) continue;
                foreach (var d in diseaseCols)
                {
                    var idx = headers.FindIndex(h => h.Contains(d));
                    if (idx < 0 || idx >= cells.Count) continue;
                    if (!double.TryParse(cells[idx].Replace(",", ""), NumberStyles.Any, CultureInfo.InvariantCulture, out var cases))
                    { Console.Error.WriteLine($"warn: skipping unparseable WDSR cell '{cells[idx]}'"); continue; }
                    rows.Add((place, d, cases));
                }
            }
        }
        return rows;
    }

    public static async Task<List<WdsrFinding>> ScrapeWdsrAsync(HttpClient http, CancellationToken ct)
    {
        var html = await http.GetStringAsync(WdsrUrl, ct);
        return ParseWdsrListings(html, WdsrUrl);
    }

    public static async Task<int> IngestWdsrTablesAsync(HealthAlertDbContext ctx, string html, CancellationToken ct)
    {
        var rows = ParseWdsrTables(html);
        var now = DateTime.UtcNow;
        var monday = now.AddDays(-(((int)now.DayOfWeek + 6) % 7)).Date;
        var week = ISOWeek.GetWeekOfYear(now);
        var seen = new HashSet<string>(await ctx.Cases
            .Where(c => c.SourceKey != null && c.SourceKey.Contains("|WDSR-"))
            .Select(c => c.SourceKey!).ToListAsync(ct));
        var tools = new SurveillanceEditTools(ctx);
        var written = 0;
        foreach (var r in rows)
        {
            var key = $"{r.Province}|WDSR-{now.Year}-W{week:D2}-{r.Disease}"; // ponytail: disease suffix keeps multi-disease weeks idempotent per disease
            if (!seen.Add(key)) continue;
            try
            {
                using var doc = JsonDocument.Parse(JsonSerializer.Serialize(new { sourceKey = key, disease = r.Disease, count = r.Cases }));
                var row = (TblCase)await tools.IngestAsync(WdsrFeed, doc.RootElement);
                row.ReportedAt = monday;
                written++;
            }
            catch (Exception ex) { seen.Remove(key); Console.Error.WriteLine($"warn: skipping WDSR row {r.Province}/{r.Disease}: {ex.Message}"); }
        }
        await ctx.SaveChangesAsync(ct);
        return written;
    }
}
