using System.Text.Json;
using System.Text.Json.Serialization;
using HealthAlert.Database;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace HealthAlert.Tools;

public record HotspotRow(string Id, string Muni, string Province, string Disease, string DiseaseName, string Level, double Lat, double Lng, int Cases, double Probability);

public record LocationRow(
    [property: JsonPropertyName("id")] string Id,
    [property: JsonPropertyName("province")] string Province,
    [property: JsonPropertyName("municipality")] string Municipality,
    [property: JsonPropertyName("barangay")] string Barangay,
    [property: JsonPropertyName("disease")] string Disease,
    [property: JsonPropertyName("diseaseName")] string DiseaseName,
    [property: JsonPropertyName("category")] string Category,
    [property: JsonPropertyName("activeCases")] int ActiveCases,
    [property: JsonPropertyName("prevWeekCases")] int PrevWeekCases,
    [property: JsonPropertyName("changePercent")] double ChangePercent,
    [property: JsonPropertyName("riskLevel")] string RiskLevel,
    [property: JsonPropertyName("outbreakProbability")] double OutbreakProbability,
    [property: JsonPropertyName("sentinelFacility")] string SentinelFacility,
    [property: JsonPropertyName("lastUpdated")] string LastUpdated);

public class RiskMapsGetTools(HealthAlertDbContext ctx, ModelRegistryTools reg, IMemoryCache cache)
{
    // ponytail: signals computed from recent cases; only coords stay static, La Union center fallback
    public async Task<List<HotspotRow>> Hotspots()
    {
        if (cache.TryGetValue("hotspots", out List<HotspotRow>? hit) && hit is not null) return hit;
        var cutoff = DateTime.UtcNow.AddDays(-28);
        var recent = await ctx.Cases.Where(c => c.ReportedAt >= cutoff).ToListAsync();
        var codes = await ctx.Diseases.ToDictionaryAsync(d => d.Id, d => d.Code ?? "");
        var thresholds = await ctx.RiskThresholds.ToListAsync();
        var cov = await ctx.CovariateReadings.OrderBy(c => c.Date).ToListAsync();
        var newest = cov.Count > 0 ? cov[^1] : null;
        var prev = cov.Count > 1 ? cov[^2] : null;
        var models = new Dictionary<string, TblForecastModel?>();
        var spots = new List<HotspotRow>();
        foreach (var g in recent
            .Where(c => c.DiseaseId.HasValue && codes.ContainsKey(c.DiseaseId.Value) && (c.SourceKey ?? "").Contains('|'))
            .GroupBy(c => (Muni: c.SourceKey!.Split('|', 2)[0], Disease: codes[c.DiseaseId!.Value])))
        {
            var rows = g.OrderBy(c => c.ReportedAt).ToList();
            var latest = rows[^1].Count ?? 0;
            var prior = rows.Count > 1 ? rows[^2].Count ?? 0 : 0;
            if (!models.TryGetValue(g.Key.Disease, out var m))
                models[g.Key.Disease] = m = await reg.DeployedAsync(g.Key.Disease);
            double prob = m is not null
                ? Math.Min(0.97, ModelRegistryTools.Predict(m, [1.0, latest, prior, Val(newest, "rainMm"), Val(prev, "rainMm"), Val(newest, "tempC"), Val(newest, "aqi"), Val(newest, "pageviews") - Val(prev, "pageviews")]) / 50)
                : ForecastGetTools.Build(g.Key.Disease).Probability;
            var t = thresholds.FirstOrDefault(t => t.Disease == g.Key.Disease) ?? RiskBandTools.DefaultFor(g.Key.Disease);
            var level = RiskBandTools.Assign(prob, latest / Math.Max(1, prior), Val(newest, t.CovariateKey ?? ""), t) switch { "moderate" => "medium", var l => l };
            var (prov, lat, lng) = Coords(g.Key.Muni);
            spots.Add(new(g.Key.Disease + "-" + g.Key.Muni.ToLowerInvariant().Replace(' ', '-'), g.Key.Muni, prov, g.Key.Disease, NameOf(g.Key.Disease), level, lat, lng, (int)Math.Round(rows.Sum(c => c.Count ?? 0)), prob));
        }
        cache.Set("hotspots", spots, TimeSpan.FromHours(1));
        return spots;
    }

    // ponytail: no cache (28-row compute); search/province/municipality = contains, disease/riskLevel = equality, null/empty/"all" = no filter
    public async Task<List<LocationRow>> LocationsAsync(string? search, string? province, string? municipality, string? disease, string? riskLevel)
    {
        var now = DateTime.UtcNow;
        var week = now.AddDays(-7);
        var fortnight = now.AddDays(-14);
        var recent = await ctx.Cases.Where(c => c.ReportedAt >= fortnight).ToListAsync();
        var codes = await ctx.Diseases.ToDictionaryAsync(d => d.Id, d => d.Code ?? "");
        var groups = recent
            .Where(c => c.DiseaseId.HasValue && codes.ContainsKey(c.DiseaseId.Value) && (c.SourceKey ?? "").Contains('|'))
            .GroupBy(c => (Muni: c.SourceKey!.Split('|', 2)[0], Disease: codes[c.DiseaseId!.Value]))
            .ToDictionary(g => g.Key, g => g.ToList());
        var thresholds = await ctx.RiskThresholds.ToListAsync();
        var cov = await ctx.CovariateReadings.OrderBy(c => c.Date).ToListAsync();
        var newest = cov.Count > 0 ? cov[^1] : null;
        var older = cov.Count > 1 ? cov[^2] : null;
        var models = new Dictionary<string, TblForecastModel?>();
        var rows = new List<LocationRow>();
        foreach (var p in DemoHistorySeeder.Places)
            foreach (var d in DemoHistorySeeder.Diseases)
            {
                groups.TryGetValue((p.Municipality, d), out var list);
                list ??= [];
                var cur = list.Where(c => c.ReportedAt >= week).Sum(c => c.Count ?? 0);
                var prv = list.Where(c => c.ReportedAt < week).Sum(c => c.Count ?? 0);
                if (!models.TryGetValue(d, out var m))
                    models[d] = m = await reg.DeployedAsync(d);
                double prob = m is not null
                    ? Math.Min(0.97, ModelRegistryTools.Predict(m, [1.0, cur, prv, Val(newest, "rainMm"), Val(older, "rainMm"), Val(newest, "tempC"), Val(newest, "aqi"), Val(newest, "pageviews") - Val(older, "pageviews")]) / 50)
                    : ForecastGetTools.Build(d).Probability;
                var t = thresholds.FirstOrDefault(t => t.Disease == d) ?? RiskBandTools.DefaultFor(d);
                var level = RiskBandTools.Assign(prob, cur / Math.Max(1, prv), Val(newest, t.CovariateKey ?? ""), t);
                rows.Add(new(
                    $"{p.Municipality}|{d}".ToLowerInvariant().Replace(' ', '-'),
                    p.Province, p.Municipality, p.Barangay, d, DemoHistorySeeder.DiseaseName(d), DemoHistorySeeder.Category(d),
                    (int)Math.Round(cur), (int)Math.Round(prv),
                    prv == 0 ? 0 : Math.Round((cur - prv) / prv * 100, 1),
                    level, prob, p.SentinelFacility,
                    (list.Count > 0 ? list.Max(c => c.ReportedAt) ?? now : now).ToString("yyyy-MM-dd")));
            }
        return rows.Where(r =>
            (NoFilter(search) || $"{r.Municipality} {r.Province} {r.Barangay} {r.Disease} {r.DiseaseName} {r.SentinelFacility}".Contains(search!, StringComparison.OrdinalIgnoreCase)) &&
            (NoFilter(province) || r.Province.Contains(province!, StringComparison.OrdinalIgnoreCase)) &&
            (NoFilter(municipality) || r.Municipality.Contains(municipality!, StringComparison.OrdinalIgnoreCase)) &&
            (NoFilter(disease) || r.Disease.Equals(disease, StringComparison.OrdinalIgnoreCase) || r.DiseaseName.Equals(disease, StringComparison.OrdinalIgnoreCase)) &&
            (NoFilter(riskLevel) || r.RiskLevel.Equals(riskLevel, StringComparison.OrdinalIgnoreCase))).ToList();
    }

    private static bool NoFilter(string? v) => string.IsNullOrWhiteSpace(v) || v.Equals("all", StringComparison.OrdinalIgnoreCase);

    private static double Val(TblCovariateReading? r, string key)
    {
        if (r?.Payload is null) return 0.0;
        try
        {
            using var d = JsonDocument.Parse(r.Payload);
            return d.RootElement.TryGetProperty(key, out var v) && v.ValueKind == JsonValueKind.Number && v.TryGetDouble(out var x) ? x : 0.0;
        }
        catch (JsonException) { return 0.0; }
    }

    private static string NameOf(string disease) => disease switch
    {
        "dengue" => "Dengue Fever",
        "leptospirosis" => "Leptospirosis",
        "ili" => "Flu-like Illness (ILI)",
        "asthma" => "Bronchial Asthma Aggravation",
        _ => disease,
    };

    private static (string Province, double Lat, double Lng) Coords(string muni) => muni switch
    {
        "San Fernando City" => ("La Union", 16.6159, 120.3209),
        "Agoo" => ("La Union", 16.3217, 120.3647),
        "Bauang" => ("La Union", 16.5244, 120.3314),
        "Bacnotan" => ("La Union", 16.7210, 120.3540),
        "Naguilian" => ("La Union", 16.5310, 120.3950),
        "Dagupan City" => ("Pangasinan", 16.0350, 120.3150),
        "Vigan City" => ("Ilocos Sur", 17.5680, 120.3820),
        "Laoag City" => ("Ilocos Norte", 18.1960, 120.5927),
        _ => ("La Union", 16.6159, 120.3209), // ponytail: La Union center fallback; extend lookup if coverage matters
    };
}
