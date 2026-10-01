using System.Text.Json;
using HealthAlert.Database;
using Microsoft.EntityFrameworkCore;

namespace HealthAlert.Tools;

public static class CovariateTools
{
    public static (double RainMm, double TempC) ParseForecast(string json)
    {
        using var d = JsonDocument.Parse(json);
        var daily = d.RootElement.GetProperty("daily");
        return (daily.GetProperty("precipitation_sum")[0].GetDouble(),
                daily.GetProperty("temperature_2m_max")[0].GetDouble());
    }

    public static int ParseAqi(string json)
    {
        using var d = JsonDocument.Parse(json);
        return d.RootElement.GetProperty("hourly").GetProperty("us_aqi")
            .EnumerateArray().Max(e => e.GetInt32());
    }

    public static long ParsePageviews(string json)
    {
        using var d = JsonDocument.Parse(json);
        return d.RootElement.GetProperty("items")
            .EnumerateArray().Sum(e => e.GetProperty("views").GetInt64());
    }
}

public class CovariateFeedService(HealthAlertDbContext ctx, HttpClient http)
{
    public static readonly Dictionary<string, (double Lat, double Lng)> Places = new()
    {
        ["San Fernando City"] = (16.6159, 120.3209),
        ["Agoo"] = (16.3217, 120.3647),
        ["Bauang"] = (16.5244, 120.3314),
    };

    public static readonly Dictionary<string, string> Articles = new()
    {
        ["dengue"] = "Dengue_fever",
        ["leptospirosis"] = "Leptospirosis",
        ["ili"] = "Influenza",
        ["asthma"] = "Asthma",
    };

    private async Task<bool> HasAsync(string place, DateTime date, string source, CancellationToken ct) =>
        await ctx.CovariateReadings.AnyAsync(c => c.Place == place && c.Date == date && c.Source == source, ct);

    public async Task RefreshDailyAsync(CancellationToken ct)
    {
        var today = DateTime.UtcNow.Date;
        foreach (var (place, coord) in Places)
        {
            if (await HasAsync(place, today, "open-meteo", ct)) continue;
            try
            {
                var json = await http.GetStringAsync(
                    $"https://api.open-meteo.com/v1/forecast?latitude={coord.Lat}&longitude={coord.Lng}&daily=precipitation_sum,temperature_2m_max&timezone=Asia%2FManila", ct);
                var (rain, temp) = CovariateTools.ParseForecast(json);
                ctx.CovariateReadings.Add(new TblCovariateReading { Place = place, Date = today, Source = "open-meteo",
                    Payload = $"{{\"rainMm\":{rain},\"tempC\":{temp}}}" });
                await ctx.SaveChangesAsync(ct);
            }
            catch (HttpRequestException) { /* last good reading stands */ }
        }
        foreach (var (place, coord) in Places)
        {
            if (await HasAsync(place, today, "open-meteo-aq", ct)) continue;
            try
            {
                var json = await http.GetStringAsync(
                    $"https://air-quality-api.open-meteo.com/v1/air-quality?latitude={coord.Lat}&longitude={coord.Lng}&hourly=us_aqi&timezone=Asia%2FManila", ct);
                var aqi = CovariateTools.ParseAqi(json);
                ctx.CovariateReadings.Add(new TblCovariateReading { Place = place, Date = today, Source = "open-meteo-aq",
                    Payload = $"{{\"aqi\":{aqi}}}" });
                await ctx.SaveChangesAsync(ct);
            }
            catch (HttpRequestException) { /* last good reading stands */ }
        }
        if (await HasAsync("Philippines", today, "wiki-pageviews", ct)) return;
        var start = today.AddDays(-6).ToString("yyyyMMdd");
        var end = today.ToString("yyyyMMdd");
        foreach (var (code, article) in Articles)
        {
            try
            {
                using var req = new HttpRequestMessage(HttpMethod.Get,
                    $"https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/all-agents/{article}/daily/{start}/{end}");
                req.Headers.TryAddWithoutValidation("User-Agent", "BantayHealthAI/1.0 (research use)");
                using var resp = await http.SendAsync(req, ct);
                resp.EnsureSuccessStatusCode();
                var json = await resp.Content.ReadAsStringAsync(ct);
                var views = CovariateTools.ParsePageviews(json);
                ctx.CovariateReadings.Add(new TblCovariateReading { Place = "Philippines", Date = today, Source = "wiki-pageviews",
                    Payload = $"{{\"disease\":\"{code}\",\"pageviews\":{views}}}" });
                await ctx.SaveChangesAsync(ct);
            }
            catch (HttpRequestException) { /* last good reading stands */ }
        }
    }
}
