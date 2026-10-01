using System.Text.Json;
using HealthAlert.Database;
using Microsoft.EntityFrameworkCore;

namespace HealthAlert.Tools;

public class ModelRegistryTools(HealthAlertDbContext ctx)
{
    // features (8 wide): [1.0 bias, casesLag1, casesLag2, rainLag2, rainLag4, tempLag1, aqiLag0, pageviewsMomentum]
    public async Task<TblForecastModel> TrainAsync(string disease)
    {
        var did = await ctx.Diseases.Where(d => d.Code == disease).Select(d => d.Id).FirstOrDefaultAsync();
        var rows = await ctx.Cases.Where(c => c.DiseaseId == did).OrderBy(c => c.ReportedAt).ToListAsync();
        if (rows.Count < 12) throw new InvalidOperationException($"insufficient history for {disease}");
        var counts = rows.Select(c => c.Count ?? 0).ToArray();
        var cov = await ctx.CovariateReadings.OrderBy(c => c.Date).ToListAsync();
        var X = new List<double[]>(); var y = new List<double>();
        for (int i = 4; i < counts.Length; i++)
            X.Add([1, counts[i - 1], counts[i - 2], Cov(cov, i - 2, "rainMm"), Cov(cov, i - 4, "rainMm"), Cov(cov, i - 1, "tempC"), Cov(cov, i, "aqi"), Cov(cov, i, "pageviews") - Cov(cov, i - 1, "pageviews")]);
        for (int i = 4; i < counts.Length; i++) y.Add(counts[i]);
        var w = RidgeRegression.Fit([.. X], [.. y], 1.0);
        var (rmse, mae, r2) = RidgeRegression.WalkForward([.. X], [.. y], 1.0);
        var ver = 1 + (await ctx.ForecastModels.Where(m => m.Disease == disease).MaxAsync(m => (int?)m.Version) ?? 0);
        var m = new TblForecastModel { Disease = disease, Version = ver,
            CoeffsJson = JsonSerializer.Serialize(w),
            TrainedFrom = rows.First().ReportedAt, TrainedTo = rows.Last().ReportedAt,
            Rmse = rmse, Mae = mae, R2 = r2, Status = "challenger" };
        ctx.ForecastModels.Add(m);
        await ctx.SaveChangesAsync();
        return m;
    }

    public Task<TblForecastModel?> DeployedAsync(string disease) =>
        ctx.ForecastModels.Where(m => m.Disease == disease && m.Status == "deployed")
            .OrderByDescending(m => m.Version).FirstOrDefaultAsync();

    public async Task PromoteAsync(long id)
    {
        var m = await ctx.ForecastModels.FindAsync(id) ?? throw new InvalidOperationException("model not found");
        foreach (var old in ctx.ForecastModels.Where(x => x.Disease == m.Disease && x.Status == "deployed"))
            old.Status = "retired";
        m.Status = "deployed";
        await ctx.SaveChangesAsync();
    }

    public static double Predict(TblForecastModel m, double[] features)
    {
        var w = JsonSerializer.Deserialize<double[]>(m.CoeffsJson!)!;
        return Math.Max(0, w.Zip(features, (a, b) => a * b).Sum());
    }

    private static double Cov(List<TblCovariateReading> cov, int idx, string key)
    {
        if (idx < 0 || idx >= cov.Count) return 0;
        try
        {
            using var d = JsonDocument.Parse(cov[idx].Payload ?? "{}");
            return d.RootElement.TryGetProperty(key, out var v) && v.ValueKind == JsonValueKind.Number && v.TryGetDouble(out var x) ? x : 0;
        }
        catch (JsonException) { return 0; }
    }
}
