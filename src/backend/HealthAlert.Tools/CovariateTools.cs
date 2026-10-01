using System.Text.Json;

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
