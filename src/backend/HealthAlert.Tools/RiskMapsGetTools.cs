using System.Text.Json;
using System.Text.Json.Serialization;
using HealthAlert.Database;
using HealthAlert.Tools.ML;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace HealthAlert.Tools;

public record HotspotRow(string Id, string Muni, string Province, string Disease, string DiseaseName, string Level, double Lat, double Lng, int Cases, double Probability,
    [property: JsonPropertyName("barangay")] string Barangay = "");

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
    [property: JsonPropertyName("lastUpdated")] string LastUpdated,
    [property: JsonPropertyName("lat")] double Lat,
    [property: JsonPropertyName("lng")] double Lng,
    [property: JsonPropertyName("populationAtRisk")] int? PopulationAtRisk = null,
    [property: JsonPropertyName("populationYear")] int? PopulationYear = null);

public record ModelMetrics(
    [property: JsonPropertyName("modelName")] string ModelName,
    [property: JsonPropertyName("version")] int Version,
    [property: JsonPropertyName("rmse")] double Rmse,
    [property: JsonPropertyName("mae")] double Mae,
    [property: JsonPropertyName("r2")] double R2,
    [property: JsonPropertyName("baselineName")] string BaselineName,
    [property: JsonPropertyName("baselineRmse")] double BaselineRmse,
    [property: JsonPropertyName("method")] string Method,
    [property: JsonPropertyName("citation")] string Citation);

public record CovariateSnapshot(
    [property: JsonPropertyName("rainMm")] double RainMm,
    [property: JsonPropertyName("tempC")] double TempC,
    [property: JsonPropertyName("aqi")] double Aqi,
    [property: JsonPropertyName("pageviews")] long Pageviews,
    [property: JsonPropertyName("date")] DateTime Date);

public record ForecastSeries(string Muni, string Disease, List<SeriesWeek> Weeks, int? ModelVersion, int HistoryLength, List<string> DataSources,
    [property: JsonPropertyName("metrics")] ModelMetrics? Metrics,
    [property: JsonPropertyName("covariates")] CovariateSnapshot? Covariates);
public record SeriesWeek(DateTime WeekStart, int? Actual, int Predicted, int CiLower, int CiUpper, bool IsFuture);

public class RiskMapsGetTools(HealthAlertDbContext ctx, ModelRegistryTools reg, IMemoryCache cache)
{
    private static readonly HashSet<string> KnownDiseases = new(StringComparer.OrdinalIgnoreCase) { "dengue", "leptospirosis", "ili", "asthma" };

    // ponytail: 12 honest history weeks (0 when no rows) + 4 projected; ±30% CI without a fitted model
    public async Task<ForecastSeries> SeriesAsync(string muni, string disease, string? brgy = null)
    {
        var code = (disease ?? "dengue").ToLowerInvariant();
        if (!KnownDiseases.Contains(code)) throw new InvalidOperationException($"unknown disease: {disease}");
        var did = await ctx.Diseases.Where(d => d.Code == code).Select(d => d.Id).FirstOrDefaultAsync();
        var rows = (await ctx.Cases.Where(c => c.DiseaseId == did).ToListAsync())
            .Where(c => { var (mu, br) = SplitKey(c.SourceKey ?? ""); return mu.Equals(muni, StringComparison.OrdinalIgnoreCase) && (string.IsNullOrWhiteSpace(brgy) || br.Equals(brgy, StringComparison.OrdinalIgnoreCase)); })
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
        var prob = model is null ? ForecastGetTools.FallbackProbability(code, lag1, lag2, Val(newest, "rainMm"), Val(newest, "tempC"), Val(newest, "aqi")) : 0;
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
        // ponytail: method/citation come from the stored risk-threshold row, never invented model names
        var threshold = await ctx.RiskThresholds.FirstOrDefaultAsync(t => t.Disease == code);
        const string noMethod = "ridge walk-forward (no published method)";
        ModelMetrics? metrics = model is null ? null : new ModelMetrics(
            $"Ridge regressor v{model.Version} ({code} walk-forward)",
            model.Version, model.Rmse ?? 0, model.Mae ?? 0, model.R2 ?? 0,
            model.BaselineName ?? "persistence", model.BaselineRmse ?? 0,
            string.IsNullOrWhiteSpace(threshold?.Method) ? noMethod : threshold!.Method!,
            string.IsNullOrWhiteSpace(threshold?.Citation) ? noMethod : threshold!.Citation!);
        return new ForecastSeries(muni, code, weeks, model?.Version, rows.Count,
            [.. feeds.Where(s => s != null).Cast<string>(), .. covSrc.Where(s => s != null).Cast<string>()],
            metrics, Snapshot(cov));
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
        // ponytail: barangay follows the directory row; harvested-only munis carry none (frontend falls back to muni)
        // ponytail: first directory barangay per town; multi-barangay dirs can't key by muni alone
        var brgyByMuni = (await PlacesAsync()).GroupBy(p => p.Municipality, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(g => g.Key, g => g.First().Barangay, StringComparer.OrdinalIgnoreCase);
        foreach (var g in recent
            .Where(c => c.DiseaseId.HasValue && codes.ContainsKey(c.DiseaseId.Value) && (c.SourceKey ?? "").Contains('|'))
            .GroupBy(c => { var (mu, br) = SplitKey(c.SourceKey!); return (Muni: mu, Barangay: br, Disease: codes[c.DiseaseId!.Value]); }))
        {
            var rows = g.OrderBy(c => c.ReportedAt).ToList();
            var latest = rows[^1].Count ?? 0;
            var prior = rows.Count > 1 ? rows[^2].Count ?? 0 : 0;
            if (!models.TryGetValue(g.Key.Disease, out var m))
                models[g.Key.Disease] = m = await reg.DeployedAsync(g.Key.Disease);
                double prob = m is not null
                    ? Math.Min(0.97, ModelRegistryTools.Predict(m, ServingFeatures(latest, prior, newest, prev)) / 50)
                    : ForecastGetTools.FallbackProbability(g.Key.Disease, latest, prior, Val(newest, "rainMm"), Val(newest, "tempC"), Val(newest, "aqi"));
            var t = thresholds.FirstOrDefault(t => t.Disease == g.Key.Disease) ?? RiskBandTools.DefaultFor(g.Key.Disease);
            var level = RiskBandTools.Assign(prob, latest / Math.Max(1, prior), Val(newest, t.CovariateKey ?? ""), t) switch { "moderate" => "medium", var l => l };
            var (prov, lat, lng) = Coords(g.Key.Muni);
            if (rows.Any(c => IsProvinceLevel(c.SourceKey ?? ""))) prov = g.Key.Muni; // ponytail: HDX/WDSR keys are province-level; surface the name, not the La Union fallback
            // ponytail: 5-part keys carry their own barangay; legacy keys fall back to the first directory row
            var gb = !string.IsNullOrWhiteSpace(g.Key.Barangay) ? g.Key.Barangay : (brgyByMuni.TryGetValue(g.Key.Muni, out var fb) ? fb : "");
            var gid = (g.Key.Disease + "-" + g.Key.Muni + (string.IsNullOrWhiteSpace(gb) ? "" : "|" + gb)).ToLowerInvariant().Replace(' ', '-');
            spots.Add(new(gid, g.Key.Muni, prov, g.Key.Disease, NameOf(g.Key.Disease), level, lat, lng, (int)Math.Round(rows.Sum(c => c.Count ?? 0)), prob, gb));
        }
        // ponytail: parity with LocationsAsync directory (Places x Diseases); quiet combos surface as low/0-case so intelligence rows always exist on the map
        var have = new HashSet<string>(spots.Select(s => s.Muni + "|" + s.Barangay + "|" + s.Disease), StringComparer.OrdinalIgnoreCase);
        foreach (var p in await PlacesAsync())
            foreach (var d in DemoHistorySeeder.Diseases)
            {
                if (!have.Add(p.Municipality + "|" + p.Barangay + "|" + d)) continue;
                var fp = ForecastGetTools.FallbackProbability(d, 0, 0, Val(newest, "rainMm"), Val(newest, "tempC"), Val(newest, "aqi"));
                var ft = thresholds.FirstOrDefault(t => t.Disease == d) ?? RiskBandTools.DefaultFor(d);
                var fl = RiskBandTools.Assign(fp, 0, Val(newest, ft.CovariateKey ?? ""), ft) switch { "moderate" => "medium", var l => l };
                var fid = (d + "-" + p.Municipality + (string.IsNullOrWhiteSpace(p.Barangay) ? "" : "|" + p.Barangay)).ToLowerInvariant().Replace(' ', '-');
                spots.Add(new(fid, p.Municipality, p.Province, d, NameOf(d), fl, p.Lat, p.Lng, 0, fp, p.Barangay));
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
            .GroupBy(c => { var (mu, br) = SplitKey(c.SourceKey!); return (Muni: mu, Barangay: br, Disease: codes[c.DiseaseId!.Value]); })
            .ToDictionary(g => g.Key, g => g.ToList());
        var thresholds = await ctx.RiskThresholds.ToListAsync();
        var cov = await ctx.CovariateReadings.OrderBy(c => c.Date).ToListAsync();
        var newest = cov.Count > 0 ? cov[^1] : null;
        var older = cov.Count > 1 ? cov[^2] : null;
        var models = new Dictionary<string, TblForecastModel?>();
        var rows = new List<LocationRow>();
        // ponytail: sum barangay populations at the latest filed year per municipality; null when none on file, never 0
        var popByMuni = (await ctx.PlacePopulations.ToListAsync())
            .GroupBy(p => p.Municipality ?? "", StringComparer.OrdinalIgnoreCase)
            .ToDictionary(g => g.Key, g =>
            {
                var y = g.Max(p => p.RefYear);
                return (Pop: (int)Math.Min(int.MaxValue, g.Where(p => p.RefYear == y).Sum(p => p.Population)), Year: y);
            }, StringComparer.OrdinalIgnoreCase);
        // ponytail: coords from the static place directory only; unknown muni -> (0,0), never invented
        // ponytail: keyed by muni|barangay; multi-barangay dirs can't key by muni alone
        var dirCoords = DemoHistorySeeder.Places.ToDictionary(p => p.Municipality + "|" + p.Barangay, p => (p.Lat, p.Lng), StringComparer.OrdinalIgnoreCase);
        // ponytail: directory rows plus observed case barangays missing from it (inherit the muni entry); legacy/empty-barangay groups match harvested "" rows
        var dir = await PlacesAsync();
        var seen = new HashSet<string>(dir.Select(p => p.Municipality + "|" + p.Barangay), StringComparer.OrdinalIgnoreCase);
        var places = new List<DemoPlace>(dir);
        foreach (var k in groups.Keys)
        {
            if (!seen.Add(k.Muni + "|" + k.Barangay)) continue;
            var b = dir.FirstOrDefault(p => p.Municipality.Equals(k.Muni, StringComparison.OrdinalIgnoreCase));
            if (b is null) { var (pv, la, ln) = Coords(k.Muni); b = new DemoPlace(k.Muni, pv, "", "", la, ln); }
            places.Add(b with { Barangay = k.Barangay });
        }
        foreach (var p in places)
            foreach (var d in DemoHistorySeeder.Diseases)
            {
                groups.TryGetValue((p.Municipality, p.Barangay, d), out var list);
                list ??= [];
                var cur = list.Where(c => c.ReportedAt >= week).Sum(c => c.Count ?? 0);
                var prv = list.Where(c => c.ReportedAt < week).Sum(c => c.Count ?? 0);
                if (!models.TryGetValue(d, out var m))
                    models[d] = m = await reg.DeployedAsync(d);
                double prob = m is not null
                    ? Math.Min(0.97, ModelRegistryTools.Predict(m, ServingFeatures(cur, prv, newest, older)) / 50)
                    : ForecastGetTools.FallbackProbability(d, cur, prv, Val(newest, "rainMm"), Val(newest, "tempC"), Val(newest, "aqi"));
                var t = thresholds.FirstOrDefault(t => t.Disease == d) ?? RiskBandTools.DefaultFor(d);
                var level = RiskBandTools.Assign(prob, cur / Math.Max(1, prv), Val(newest, t.CovariateKey ?? ""), t);
                var (lat, lng) = dirCoords.TryGetValue(p.Municipality + "|" + p.Barangay, out var c) ? c : (0.0, 0.0);
                var pop = popByMuni.TryGetValue(p.Municipality, out var pv) ? pv : ((int, int)?)null;
                rows.Add(new(
                    (string.IsNullOrWhiteSpace(p.Barangay) ? $"{p.Municipality}|{d}" : $"{p.Municipality}|{p.Barangay}|{d}").ToLowerInvariant().Replace(' ', '-'),
                    p.Province, p.Municipality, p.Barangay, d, DemoHistorySeeder.DiseaseName(d), DemoHistorySeeder.Category(d),
                    (int)Math.Round(cur), (int)Math.Round(prv),
                    prv == 0 ? 0 : Math.Round((cur - prv) / prv * 100, 1),
                    level, prob, p.SentinelFacility,
                    (list.Count > 0 ? list.Max(c => c.ReportedAt) ?? now : now).ToString("yyyy-MM-dd"),
                    lat, lng, pop?.Item1, pop?.Item2));
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
        // ponytail: pipe-less probe keys (test-*, esu-*, weather-*) are not places; real keys are muni|... shaped
        keys = keys.Where(k => k.Contains('|')).ToList();
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

    // ponytail: 5-part keys carry barangay in segment 1; older shapes fall back to the directory entry
    private static (string Muni, string Barangay) SplitKey(string key)
    {
        var parts = (key ?? "").Split('|');
        return parts.Length >= 5 ? (parts[0], parts[1]) : (parts[0], "");
    }

    private static bool IsProvinceLevel(string key) =>
        key.Contains("|HDX-", StringComparison.Ordinal) || key.Contains("|WDSR-", StringComparison.Ordinal);

    // ponytail: per-key newest value across readings; missing keys -> 0, no readings -> null
    private static CovariateSnapshot? Snapshot(List<TblCovariateReading> cov)
    {
        if (cov.Count == 0) return null;
        var ordered = cov.OrderBy(c => c.Date).ToList();
        return new CovariateSnapshot(Key("rainMm"), Key("tempC"), Key("aqi"), (long)Key("pageviews"), ordered[^1].Date ?? DateTime.UtcNow);

        double Key(string key)
        {
            foreach (var r in ((IEnumerable<TblCovariateReading>)ordered).Reverse())
            {
                if (r.Payload is null) continue;
                try
                {
                    using var d = JsonDocument.Parse(r.Payload);
                    if (d.RootElement.TryGetProperty(key, out var v) && v.ValueKind == JsonValueKind.Number && v.TryGetDouble(out var x)) return x;
                }
                catch (JsonException) { }
            }
            return 0;
        }
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
        "San Juan" => ("La Union", 16.6745, 120.3263),
        "Dagupan City" => ("Pangasinan", 16.0350, 120.3150),
        "San Carlos City" => ("Pangasinan", 16.0176, 120.3420),
        "Alaminos City" => ("Pangasinan", 16.1551, 119.9806),
        "Vigan City" => ("Ilocos Sur", 17.5680, 120.3820),
        "Candon City" => ("Ilocos Sur", 17.5948, 120.4517),
        "Narvacan" => ("Ilocos Sur", 17.4256, 120.4737),
        "Tagudin" => ("Ilocos Sur", 16.9428, 120.4514),
        "Laoag City" => ("Ilocos Norte", 18.1960, 120.5927),
        "Batac City" => ("Ilocos Norte", 18.0539, 120.5416),
        "San Nicolas" => ("Ilocos Norte", 18.1783, 120.5917),
        "Paoay" => ("Ilocos Norte", 18.0614, 120.5247),
        "Urdaneta City" => ("Pangasinan", 15.9760, 120.5709),
        "Rosario" => ("La Union", 16.2365, 120.4641),
        "Santo Tomas" => ("La Union", 16.2826, 120.3965),
        "Calasiao" => ("Pangasinan", 16.0160, 120.4195),
        "Mangaldan" => ("Pangasinan", 16.0673, 120.4043),
        "Binmaley" => ("Pangasinan", 16.0311, 120.2724),
        "Dingras" => ("Ilocos Norte", 18.0997, 120.6973),
        _ => ("La Union", 16.6159, 120.3209), // ponytail: La Union center fallback; extend lookup if coverage matters
    };
}
