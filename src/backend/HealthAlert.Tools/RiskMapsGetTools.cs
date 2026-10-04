using System.Text.Json;
using System.Text.Json.Serialization;
using HealthAlert.Database;
using HealthAlert.Tools.ML;
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

public record ForecastSeries(string Muni, string Disease, List<SeriesWeek> Weeks, int? ModelVersion, int HistoryLength, List<string> DataSources);
public record SeriesWeek(DateTime WeekStart, int? Actual, int Predicted, int CiLower, int CiUpper, bool IsFuture);

public class RiskMapsGetTools(HealthAlertDbContext ctx, ModelRegistryTools reg, IMemoryCache cache)
{
    private static readonly HashSet<string> KnownDiseases = new(StringComparer.OrdinalIgnoreCase) { "dengue", "leptospirosis", "ili", "asthma" };

    // ponytail: 12 honest history weeks (0 when no rows) + 4 projected; ±30% CI without a fitted model
    public async Task<ForecastSeries> SeriesAsync(string muni, string disease)
    {
        var code = (disease ?? "dengue").ToLowerInvariant();
        if (!KnownDiseases.Contains(code)) throw new InvalidOperationException($"unknown disease: {disease}");
        var did = await ctx.Diseases.Where(d => d.Code == code).Select(d => d.Id).FirstOrDefaultAsync();
        var rows = (await ctx.Cases.Where(c => c.DiseaseId == did).ToListAsync())
            .Where(c => (c.SourceKey ?? "").Split('|', 2)[0].Equals(muni, StringComparison.OrdinalIgnoreCase))
            .ToList();
        var today = DateTime.UtcNow.Date;
        var lastMonday = today.AddDays(-(((int)today.DayOfWeek + 6) % 7));
        var past = Enumerable.Range(0, 12).Select(i => lastMonday.AddDays(-7 * (11 - i))).ToList();
        var actuals = past.Select(w => (int)Math.Round(rows.Where(c => c.ReportedAt >= w && c.ReportedAt < w.AddDays(7)).Sum(c => c.Count ?? 0))).ToList();
        var cov = await ctx.CovariateReadings.OrderBy(c => c.Date).ToListAsync();
        var newest = cov.Count > 0 ? cov[^1] : null;
        var prev = cov.Count > 1 ? cov[^2] : null;
        var model = await reg.DeployedAsync(code);
        var weeks = past.Select((w, i) => new SeriesWeek(w, actuals[i], actuals[i], actuals[i], actuals[i], false)).ToList();
        double lag1 = actuals.Count > 0 ? actuals[^1] : 0, lag2 = actuals.Count > 1 ? actuals[^2] : 0;
        var prob = model is null ? ForecastGetTools.Build(code).Probability : 0;
        for (int i = 1; i <= 4; i++)
        {
            int pred;
            if (model is not null)
            {
                pred = Math.Max(0, (int)Math.Round(ModelRegistryTools.Predict(model, ServingFeatures(lag1, lag2, newest, prev))));
                lag2 = lag1; lag1 = pred;
            }
            else pred = Math.Max(0, (int)Math.Round(prob * lag1));
            var (lo, hi) = model is not null
                ? (Math.Max(0, (int)Math.Round(pred - 1.96 * (model.Rmse ?? 0))), (int)Math.Round(pred + 1.96 * (model.Rmse ?? 0)))
                : (Math.Max(0, (int)Math.Round(pred * 0.7)), (int)Math.Round(pred * 1.3));
            weeks.Add(new SeriesWeek(lastMonday.AddDays(7 * i), null, pred, lo, hi, true));
        }
        var feedIds = rows.Where(c => c.FeedId != null).Select(c => c.FeedId!.Value).Distinct().ToList();
        var feeds = feedIds.Count > 0 ? await ctx.Feeds.Where(f => feedIds.Contains(f.Id)).Select(f => f.Code).ToListAsync() : [];
        var covSrc = await ctx.CovariateReadings.Select(c => c.Source).Distinct().ToListAsync();
        return new ForecastSeries(muni, code, weeks, model?.Version, rows.Count,
            [.. feeds.Where(s => s != null).Cast<string>(), .. covSrc.Where(s => s != null).Cast<string>()]);
    }

    // ponytail: single 8-wide feature builder for Hotspots/LocationsAsync/SeriesAsync; twin copy lives in ForecastGetTools.OutlookAsync, keep order in sync
    private static double[] ServingFeatures(double lag1, double lag2, TblCovariateReading? newest, TblCovariateReading? prev) =>
        [1.0, lag1, lag2, Val(newest, "rainMm"), Val(prev, "rainMm"), Val(newest, "tempC"), Val(newest, "aqi"), Val(newest, "pageviews") - Val(prev, "pageviews")];
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
                ? Math.Min(0.97, ModelRegistryTools.Predict(m, ServingFeatures(latest, prior, newest, prev)) / 50)
                : ForecastGetTools.Build(g.Key.Disease).Probability;
            var t = thresholds.FirstOrDefault(t => t.Disease == g.Key.Disease) ?? RiskBandTools.DefaultFor(g.Key.Disease);
            var level = RiskBandTools.Assign(prob, latest / Math.Max(1, prior), Val(newest, t.CovariateKey ?? ""), t) switch { "moderate" => "medium", var l => l };
            var (prov, lat, lng) = Coords(g.Key.Muni);
            if (rows.Any(c => IsProvinceLevel(c.SourceKey ?? ""))) prov = g.Key.Muni; // ponytail: HDX/WDSR keys are province-level; surface the name, not the La Union fallback
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
        foreach (var p in await PlacesAsync())
            foreach (var d in DemoHistorySeeder.Diseases)
            {
                groups.TryGetValue((p.Municipality, d), out var list);
                list ??= [];
                var cur = list.Where(c => c.ReportedAt >= week).Sum(c => c.Count ?? 0);
                var prv = list.Where(c => c.ReportedAt < week).Sum(c => c.Count ?? 0);
                if (!models.TryGetValue(d, out var m))
                    models[d] = m = await reg.DeployedAsync(d);
                double prob = m is not null
                    ? Math.Min(0.97, ModelRegistryTools.Predict(m, ServingFeatures(cur, prv, newest, older)) / 50)
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

    // ponytail: national directory = static seeds UNION harvested case prefixes; HDX/WDSR prefixes are province-level so province = name
    private async Task<List<DemoPlace>> PlacesAsync()
    {
        var keys = await ctx.Cases.Where(c => c.SourceKey != null).Select(c => c.SourceKey!).ToListAsync();
        var provinceLevel = keys.Where(IsProvinceLevel).Select(Prefix).ToHashSet(StringComparer.OrdinalIgnoreCase);
        var known = new HashSet<string>(DemoHistorySeeder.Places.Select(p => p.Municipality), StringComparer.OrdinalIgnoreCase);
        var dir = new List<DemoPlace>(DemoHistorySeeder.Places);
        foreach (var muni in keys.Select(Prefix).Distinct(StringComparer.OrdinalIgnoreCase))
        {
            if (muni.Length == 0 || !known.Add(muni)) continue;
            var (prov0, lat, lng) = Coords(muni);
            dir.Add(new DemoPlace(muni, provinceLevel.Contains(muni) ? muni : prov0, "", "DOH PIDSR reporting units", lat, lng));
        }
        return dir;
    }

    private static string Prefix(string key) => key.Split('|', 2)[0];

    private static bool IsProvinceLevel(string key) =>
        key.Contains("|HDX-", StringComparison.Ordinal) || key.Contains("|WDSR-", StringComparison.Ordinal);

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
