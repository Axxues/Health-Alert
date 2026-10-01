using HealthAlert.Tools;

namespace HealthAlert.Tests;

public class CovariateParseTest
{
    [Fact]
    public void ParseForecast_reads_daily_rain_and_temp()
    {
        var json = "{\"daily\":{\"precipitation_sum\":[12.5],\"temperature_2m_max\":[31.0]}}";
        var (rain, temp) = CovariateTools.ParseForecast(json);
        Assert.Equal(12.5, rain);
        Assert.Equal(31.0, temp);
    }

    [Fact]
    public void ParseAqi_reads_us_aqi_max()
    {
        var json = "{\"hourly\":{\"us_aqi\":[38,42,51]}}";
        Assert.Equal(51, CovariateTools.ParseAqi(json));
    }

    [Fact]
    public void ParsePageviews_sums_daily_views()
    {
        var json = "{\"items\":[{\"views\":100},{\"views\":80}]}";
        Assert.Equal(180, CovariateTools.ParsePageviews(json));
    }
}
