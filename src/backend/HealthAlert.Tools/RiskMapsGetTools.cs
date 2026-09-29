namespace HealthAlert.Tools;

public class RiskMapsGetTools
{
    public object Hotspots() => new[]
    {
        // La Union
        new { id = "lu-sfc-sevilla", muni = "Brgy. Sevilla, San Fernando City", disease = "dengue", diseaseName = "Dengue Fever", level = "high", lat = 16.6159, lng = 120.3209, cases = 48, probability = 0.82 },
        new { id = "lu-sfc-catbangen", muni = "Brgy. Catbangen, San Fernando City", disease = "dengue", diseaseName = "Dengue Fever", level = "high", lat = 16.6080, lng = 120.3170, cases = 42, probability = 0.76 },
        new { id = "lu-sfc-lingsat", muni = "Brgy. Lingsat, San Fernando City", disease = "ili", diseaseName = "Flu-like Illness (ILI)", level = "medium", lat = 16.6380, lng = 120.3270, cases = 38, probability = 0.54 },
        new { id = "lu-agoo-san-nicolas", muni = "Brgy. San Nicolas, Agoo", disease = "leptospirosis", diseaseName = "Leptospirosis", level = "high", lat = 16.3217, lng = 120.3647, cases = 24, probability = 0.79 },
        new { id = "lu-agoo-sta-barbara", muni = "Brgy. Santa Barbara, Agoo", disease = "leptospirosis", diseaseName = "Leptospirosis", level = "medium", lat = 16.3150, lng = 120.3580, cases = 16, probability = 0.48 },
        new { id = "lu-bauang-central-east", muni = "Brgy. Central East, Bauang", disease = "dengue", diseaseName = "Dengue Fever", level = "medium", lat = 16.5244, lng = 120.3314, cases = 32, probability = 0.58 },
        new { id = "lu-bauang-parian-oeste", muni = "Brgy. Parian Oeste, Bauang", disease = "asthma", diseaseName = "Bronchial Asthma Aggravation", level = "medium", lat = 16.5380, lng = 120.3220, cases = 20, probability = 0.45 },
        new { id = "lu-bacnotan-poblacion", muni = "Brgy. Poblacion, Bacnotan", disease = "ili", diseaseName = "Flu-like Illness (ILI)", level = "low", lat = 16.7210, lng = 120.3540, cases = 18, probability = 0.22 },
        new { id = "lu-naguilian-ortiz", muni = "Brgy. Ortiz, Naguilian", disease = "dengue", diseaseName = "Dengue Fever", level = "medium", lat = 16.5310, lng = 120.3950, cases = 26, probability = 0.51 },

        // Pangasinan
        new { id = "pan-dagupan-lucao", muni = "Brgy. Lucao, Dagupan City", disease = "dengue", diseaseName = "Dengue Fever", level = "high", lat = 16.0350, lng = 120.3150, cases = 52, probability = 0.84 },
        new { id = "pan-dagupan-pantal", muni = "Brgy. Pantal, Dagupan City", disease = "leptospirosis", diseaseName = "Leptospirosis", level = "high", lat = 16.0480, lng = 120.3400, cases = 28, probability = 0.81 },
        new { id = "pan-san-fabian-poblacion", muni = "Brgy. Poblacion, San Fabian", disease = "ili", diseaseName = "Flu-like Illness (ILI)", level = "low", lat = 16.1210, lng = 120.4020, cases = 22, probability = 0.28 },
        new { id = "pan-lingayen-poblacion", muni = "Brgy. Poblacion, Lingayen", disease = "leptospirosis", diseaseName = "Leptospirosis", level = "medium", lat = 16.0222, lng = 120.2319, cases = 19, probability = 0.52 },

        // Ilocos Sur
        new { id = "is-vigan-pantay-daya", muni = "Brgy. Pantay Daya, Vigan City", disease = "dengue", diseaseName = "Dengue Fever", level = "medium", lat = 17.5680, lng = 120.3820, cases = 36, probability = 0.62 },
        new { id = "is-candon-san-nicolas", muni = "Brgy. San Nicolas, Candon City", disease = "asthma", diseaseName = "Bronchial Asthma Aggravation", level = "medium", lat = 17.1920, lng = 120.4480, cases = 19, probability = 0.44 },

        // Ilocos Norte
        new { id = "in-laoag-san-guillermo", muni = "Brgy. San Guillermo, Laoag City", disease = "ili", diseaseName = "Flu-like Illness (ILI)", level = "low", lat = 18.1960, lng = 120.5927, cases = 20, probability = 0.25 },
        new { id = "in-laoag-nalbo", muni = "Brgy. Nalbo, Laoag City", disease = "asthma", diseaseName = "Bronchial Asthma Aggravation", level = "low", lat = 18.1880, lng = 120.5840, cases = 15, probability = 0.28 },
    };
}
