using System.Text.Json;
using HealthAlert.Database;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace HealthAlert.Tools;

public record HotspotRow(string Id, string Muni, string Province, string Disease, string DiseaseName, string Level, double Lat, double Lng, int Cases, double Probability);

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
