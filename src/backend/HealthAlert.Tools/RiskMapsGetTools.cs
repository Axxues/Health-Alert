namespace HealthAlert.Tools;

public class RiskMapsGetTools
{
    public object Hotspots() => new[]
    {
        new { muni = "Brgy. Sevilla, San Fernando City", disease = "dengue", level = "high", lat = 16.6159, lng = 120.3209 },
        new { muni = "Brgy. Catbangen, San Fernando City", disease = "dengue", level = "high", lat = 16.6080, lng = 120.3170 },
        new { muni = "Brgy. San Nicolas, Agoo", disease = "leptospirosis", level = "high", lat = 16.3217, lng = 120.3647 },
        new { muni = "Brgy. Pantal, Dagupan City", disease = "leptospirosis", level = "high", lat = 16.0480, lng = 120.3400 },
        new { muni = "Brgy. Lucao, Dagupan City", disease = "dengue", level = "medium", lat = 16.0350, lng = 120.3150 },
        new { muni = "Brgy. Lingsat, San Fernando City", disease = "ili", level = "medium", lat = 16.6380, lng = 120.3270 },
        new { muni = "Brgy. Central, Bauang", disease = "dengue", level = "medium", lat = 16.5244, lng = 120.3314 },
        new { muni = "Brgy. Tamag, Vigan City", disease = "dengue", level = "medium", lat = 17.5680, lng = 120.3820 },
        new { muni = "Brgy. Nalbo, Laoag City", disease = "asthma", level = "low", lat = 18.1960, lng = 120.5927 },
        new { muni = "Brgy. Poblacion, Lingayen", disease = "leptospirosis", level = "medium", lat = 16.0222, lng = 120.2319 },
        new { muni = "San Roque", disease = "dengue", level = "high", lat = 14.6, lng = 121.0 },
        new { muni = "Sta. Cruz", disease = "leptospirosis", level = "medium", lat = 14.5, lng = 121.1 },
    };
}
