using System.Text.Json;
using HealthAlert.Database;
using HealthAlert.Tools.ML;
using Microsoft.EntityFrameworkCore;

namespace HealthAlert.Tools;

// ponytail: closed-form math, real Bi-LSTM sidecar if accuracy demands
public interface IForecaster { string Disease { get; } double Probability(double[] lags, double[] cov); bool IsOutbreak(double[] hist); }

public class DengueForecaster : IForecaster
{
    public string Disease => "dengue";
    public double Probability(double[] l, double[] c) => Math.Min(0.97, (l.Average() + c.Sum() * 0.01) / 50);
    public bool IsOutbreak(double[] h) { var m = h.Average(); var sd = Math.Sqrt(h.Select(x => (x - m) * (x - m)).Average()); return h.Last() > m + sd; }
}

public class DlnmForecaster
{
    public double Rr(string band) => band switch { "light" => 1.30, "moderate" => 1.53, "heavy" => 2.45, "intense" => 4.61, "torrential" => 13.77, _ => 1.0 };
}

public class HiAqiForecaster
{
    public double Hi(double T, double R) => -42.379 + 2.049 * T + 10.143 * R - 0.225 * T * R - 0.0068 * T * T - 0.0548 * R * R + 0.0012 * T * T * R + 0.00085 * T * R * R - 0.00000199 * T * T * R * R;
    public string Band(double T, double R) { var c = (Hi(T, R) - 32) * 5 / 9; return c >= 52 ? "Extreme Danger" : c >= 42 ? "Danger" : c >= 33 ? "Extreme Caution" : "Caution"; }
    public bool AsthmaAlert(double aqi, int lag) => aqi > 100 && lag == 0; } // ponytail: RR1.42 fixed, stratify by age if clinicians ask

public class ArgoForecaster : IForecaster
{
    public string Disease => "ili";
    public double Probability(double[] l, double[] t) => Math.Min(0.95, (l.Last() * 0.7 + t.Last() * 0.3) / 40);
    public bool IsOutbreak(double[] h) => h.TakeLast(2).Average() > h.Take(h.Length - 2).Average() * 1.2;
}

public record ForecastOutlook(double Probability, string Band, string[] Drivers, string? Muni = null);

public class ForecastGetTools(HealthAlertDbContext ctx, ModelRegistryTools reg)
{
    public async Task<ForecastOutlook> OutlookAsync(string? disease, string? muni)
    {
        var o = Build(disease);
        if (disease is not null)
        {
            var deployed = await reg.DeployedAsync(disease);
            if (deployed is not null)
            {
                var did = await ctx.Diseases.Where(d => d.Code == disease).Select(d => d.Id).FirstOrDefaultAsync();
                var lags = await ctx.Cases.Where(c => c.DiseaseId == did).OrderByDescending(c => c.ReportedAt).Take(2).Select(c => c.Count ?? 0).ToListAsync();
                var cov = await ctx.CovariateReadings.OrderBy(c => c.Date).ToListAsync();
                var newest = cov.Count > 0 ? cov[^1] : null;
                var prev = cov.Count > 1 ? cov[^2] : null;
                double[] feat = [1.0,
                    lags.Count > 0 ? lags[0] : 0.0,
                    lags.Count > 1 ? lags[1] : 0.0,
                    Val(newest, "rainMm"), Val(prev, "rainMm"), Val(newest, "tempC"), Val(newest, "aqi"),
                    Val(newest, "pageviews") - Val(prev, "pageviews")];
                var prob = Math.Min(0.97, ModelRegistryTools.Predict(deployed, feat) / 50);
                return o with { Probability = prob, Muni = muni, Drivers = ["fitted-model", .. o.Drivers.Take(2)] };
            }
        }
        var n = await ctx.Cases.CountAsync(); // ponytail: count shifts probability; real covariates if accuracy matters
        return o with { Probability = Math.Min(0.97, o.Probability + n * 0.01), Muni = muni };
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

    internal static ForecastOutlook Build(string? disease) => disease switch
    {
        "leptospirosis" => new(0.45, "heavy", ["rainfall", "flood"]),
        "ili" => new(new ArgoForecaster().Probability([10, 12], [20, 22]), "Caution", ["cases", "search-trends"]),
        "asthma" => new(0.6, new HiAqiForecaster().Band(103, 60), ["aqi", "heat-index"]),
        _ => new(new DengueForecaster().Probability([10, 12, 11], [30, 70]), "Caution", ["cases", "temperature", "rainfall"]),
    };

    // ponytail: naive no-model fallback wired to the row's real counts + live covariates (zero activity -> near zero); train/promote a fitted model when accuracy matters
    internal static double FallbackProbability(string? disease, double cur, double prv, double rain, double temp, double aqi) => disease switch
    {
        "ili" => new ArgoForecaster().Probability([prv, cur], [prv, cur]),
        "leptospirosis" => Math.Min(0.97, ((cur + prv) / 2 + rain * 0.05) / 50),
        "asthma" => Math.Min(0.97, ((cur + prv) / 2 + aqi * 0.05) / 50),
        _ => new DengueForecaster().Probability([prv, cur], [rain, temp]),
    };
}
