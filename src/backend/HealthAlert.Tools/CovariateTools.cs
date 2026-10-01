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

    public async Task RefreshDailyAsync(CancellationToken ct)
    {
        var today = DateTime.UtcNow.Date;
        foreach (var (place, coord) in Places)
        {
            if (await ctx.CovariateReadings.AnyAsync(c => c.Place == place && c.Date == today && c.Source == "open-meteo", ct)) continue;
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
    }
}
