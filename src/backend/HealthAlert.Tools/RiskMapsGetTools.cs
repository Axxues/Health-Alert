namespace HealthAlert.Tools;

public class RiskMapsGetTools
{
    public object Hotspots() => new[]
    {
        new { muni = "San Roque", disease = "dengue", level = "high", lat = 14.6, lng = 121.0 },
        new { muni = "Sta. Cruz", disease = "leptospirosis", level = "medium", lat = 14.5, lng = 121.1 },
    };
}
