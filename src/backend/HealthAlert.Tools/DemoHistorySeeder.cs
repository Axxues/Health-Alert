using System.Globalization;
using HealthAlert.Database;
using Microsoft.EntityFrameworkCore;

namespace HealthAlert.Tools;

// ponytail: demo place directory lives here so seeder + locations endpoint share it;
// names/facilities/coords mirror frontend riskmaps.api.ts (RiskMapsGetTools has no barangay/facility/Lingayen data)
public record DemoPlace(string Municipality, string Province, string Barangay, string SentinelFacility, double Lat, double Lng);

public static class DemoHistorySeeder
{
    public const string Feed = UploadTools.DemoFeedCode;
    public static readonly string[] Diseases = ["dengue", "leptospirosis", "ili", "asthma"];
    public const int DemoWeeks = 8;
    public static readonly string[] Preparers = ["J. Dela Cruz", "M. Santos", "R. Aquino", "L. Ramos"];
    public static readonly string[] Contacts = ["09171234567", "09181234567", "09191234567"];

    public static readonly DemoPlace[] Places =
    [
        new("San Fernando City", "La Union", "Sevilla", "Bethany Hospital / CHO San Fernando", 16.6159, 120.3209),
        new("Agoo", "La Union", "San Nicolas", "La Union Medical Center (LUMC)", 16.3217, 120.3647),
        new("Bauang", "La Union", "Central East", "Bauang RHU / Municipal Health Center", 16.5244, 120.3314),
        new("Bacnotan", "La Union", "Baroro", "Bacnotan RHU / Municipal Health Center", 16.7210, 120.3540),
        new("Naguilian", "La Union", "Poblacion", "Naguilian RHU / Municipal Health Center", 16.5310, 120.3950),
        new("San Juan", "La Union", "Poblacion", "San Juan RHU / Municipal Health Center", 16.6745, 120.3263),
        new("Dagupan City", "Pangasinan", "Lucao", "Region 1 Medical Center (R1MC)", 16.0350, 120.3150),
        new("Lingayen", "Pangasinan", "Poblacion", "Lingayen District Hospital", 16.0222, 120.2319),
        new("Urdaneta City", "Pangasinan", "Poblacion", "Urdaneta District Hospital", 15.9760, 120.5709),
        new("San Carlos City", "Pangasinan", "Poblacion", "Pangasinan Provincial Hospital", 16.0176, 120.3420),
        new("Alaminos City", "Pangasinan", "Poblacion", "Alaminos City Health Office", 16.1551, 119.9806),
        new("Vigan City", "Ilocos Sur", "Pantay Daya", "Gabriela Silang General Hospital", 17.5680, 120.3820),
        new("Candon City", "Ilocos Sur", "Poblacion", "Candon City Health Office", 17.5948, 120.4517),
        new("Narvacan", "Ilocos Sur", "Poblacion", "Narvacan RHU / Municipal Health Center", 17.4256, 120.4737),
        new("Tagudin", "Ilocos Sur", "Poblacion", "Tagudin RHU / Municipal Health Center", 16.9428, 120.4514),
        new("Laoag City", "Ilocos Norte", "Nalbo", "Laoag City Health Office", 18.1880, 120.5840),
        new("Batac City", "Ilocos Norte", "Poblacion", "Mariano Marcos Memorial Hospital", 18.0539, 120.5416),
        new("San Nicolas", "Ilocos Norte", "Poblacion", "San Nicolas RHU / Municipal Health Center", 18.1783, 120.5917),
        new("Paoay", "Ilocos Norte", "Poblacion", "Paoay RHU / Municipal Health Center", 18.0614, 120.5247),
        // ponytail: real barangays sit hundreds of meters apart; same-town stations share town coords
        // with ±0.001–0.003 deterministic jitter so merged map nodes don't stack. Barangay names beyond
        // the original directory are best-known approximations, never duplicated within a municipality.
        new("San Fernando City", "La Union", "Catbangen", "Bethany Hospital / CHO San Fernando", 16.6177, 120.3222),
        new("San Fernando City", "La Union", "Lingsat", "Bethany Hospital / CHO San Fernando", 16.6137, 120.3192),
        new("Agoo", "La Union", "Santa Barbara", "La Union Medical Center (LUMC)", 16.3235, 120.3660),
        new("Agoo", "La Union", "San Antonio", "La Union Medical Center (LUMC)", 16.3195, 120.3630),
        new("Bauang", "La Union", "Central West", "Bauang RHU / Municipal Health Center", 16.5262, 120.3327),
        new("Bauang", "La Union", "Quinavite", "Bauang RHU / Municipal Health Center", 16.5222, 120.3297),
        new("Bacnotan", "La Union", "Poblacion", "Bacnotan RHU / Municipal Health Center", 16.7228, 120.3553),
        new("Bacnotan", "La Union", "Tammocalao", "Bacnotan RHU / Municipal Health Center", 16.7188, 120.3523),
        new("Naguilian", "La Union", "Gusing", "Naguilian RHU / Municipal Health Center", 16.5328, 120.3963),
        new("Naguilian", "La Union", "Ortiz", "Naguilian RHU / Municipal Health Center", 16.5288, 120.3933),
        new("San Juan", "La Union", "Urbiztondo", "San Juan RHU / Municipal Health Center", 16.6763, 120.3276),
        new("San Juan", "La Union", "Lubing", "San Juan RHU / Municipal Health Center", 16.6723, 120.3246),
        new("Dagupan City", "Pangasinan", "Pantal", "Region 1 Medical Center (R1MC)", 16.0368, 120.3163),
        new("Dagupan City", "Pangasinan", "Bonuan Gueset", "Region 1 Medical Center (R1MC)", 16.0328, 120.3133),
        new("Lingayen", "Pangasinan", "Libsong", "Lingayen District Hospital", 16.0240, 120.2332),
        new("Lingayen", "Pangasinan", "Pangapisan", "Lingayen District Hospital", 16.0200, 120.2302),
        new("Urdaneta City", "Pangasinan", "San Vicente", "Urdaneta District Hospital", 15.9778, 120.5722),
        new("Urdaneta City", "Pangasinan", "Nancayasan", "Urdaneta District Hospital", 15.9738, 120.5692),
        new("San Carlos City", "Pangasinan", "Rizal", "Pangasinan Provincial Hospital", 16.0194, 120.3433),
        new("San Carlos City", "Pangasinan", "Bolingit", "Pangasinan Provincial Hospital", 16.0154, 120.3403),
        new("Alaminos City", "Pangasinan", "Lucap", "Alaminos City Health Office", 16.1569, 119.9819),
        new("Alaminos City", "Pangasinan", "Bued", "Alaminos City Health Office", 16.1529, 119.9789),
        new("Vigan City", "Ilocos Sur", "Pagburnayan", "Gabriela Silang General Hospital", 17.5698, 120.3833),
        new("Vigan City", "Ilocos Sur", "Poblacion", "Gabriela Silang General Hospital", 17.5658, 120.3803),
        new("Candon City", "Ilocos Sur", "San Nicolas", "Candon City Health Office", 17.5966, 120.4530),
        new("Candon City", "Ilocos Sur", "Bagani", "Candon City Health Office", 17.5926, 120.4500),
        new("Narvacan", "Ilocos Sur", "San Pedro", "Narvacan RHU / Municipal Health Center", 17.4274, 120.4750),
        new("Narvacan", "Ilocos Sur", "Santa Lucia", "Narvacan RHU / Municipal Health Center", 17.4234, 120.4720),
        new("Tagudin", "Ilocos Sur", "Quirino", "Tagudin RHU / Municipal Health Center", 16.9446, 120.4527),
        new("Tagudin", "Ilocos Sur", "Libtong", "Tagudin RHU / Municipal Health Center", 16.9406, 120.4497),
        new("Laoag City", "Ilocos Norte", "San Matias", "Laoag City Health Office", 18.1898, 120.5853),
        new("Laoag City", "Ilocos Norte", "Nangalisan", "Laoag City Health Office", 18.1858, 120.5823),
        new("Batac City", "Ilocos Norte", "Ablan", "Mariano Marcos Memorial Hospital", 18.0557, 120.5429),
        new("Batac City", "Ilocos Norte", "Valdez", "Mariano Marcos Memorial Hospital", 18.0517, 120.5399),
        new("San Nicolas", "Ilocos Norte", "San Eugenio", "San Nicolas RHU / Municipal Health Center", 18.1801, 120.5930),
        new("San Nicolas", "Ilocos Norte", "San Baltazar", "San Nicolas RHU / Municipal Health Center", 18.1761, 120.5900),
        new("Paoay", "Ilocos Norte", "Mumulaan", "Paoay RHU / Municipal Health Center", 18.0632, 120.5260),
        new("Paoay", "Ilocos Norte", "Nanguyudan", "Paoay RHU / Municipal Health Center", 18.0592, 120.5230),
        new("Rosario", "La Union", "Poblacion", "Rosario RHU / Municipal Health Center", 16.2365, 120.4641),
        new("Rosario", "La Union", "Concepcion", "Rosario RHU / Municipal Health Center", 16.2383, 120.4654),
        new("Santo Tomas", "La Union", "Poblacion", "Santo Tomas RHU / Municipal Health Center", 16.2826, 120.3965),
        new("Santo Tomas", "La Union", "Ubagan", "Santo Tomas RHU / Municipal Health Center", 16.2844, 120.3978),
        new("Calasiao", "Pangasinan", "Poblacion", "Calasiao RHU / Municipal Health Center", 16.0160, 120.4195),
        new("Calasiao", "Pangasinan", "San Miguel", "Calasiao RHU / Municipal Health Center", 16.0178, 120.4208),
        new("Mangaldan", "Pangasinan", "Poblacion", "Mangaldan RHU / Municipal Health Center", 16.0673, 120.4043),
        new("Mangaldan", "Pangasinan", "Buenlag", "Mangaldan RHU / Municipal Health Center", 16.0691, 120.4056),
        new("Binmaley", "Pangasinan", "Poblacion", "Binmaley RHU / Municipal Health Center", 16.0311, 120.2724),
        new("Binmaley", "Pangasinan", "Parayao", "Binmaley RHU / Municipal Health Center", 16.0329, 120.2737),
        new("Dingras", "Ilocos Norte", "Poblacion", "Dingras RHU / Municipal Health Center", 18.0997, 120.6973),
        new("Dingras", "Ilocos Norte", "Madamba", "Dingras RHU / Municipal Health Center", 18.1015, 120.6986),
    ];

    public static string DiseaseName(string d) => d switch
    {
        "dengue" => "Dengue Fever",
        "leptospirosis" => "Leptospirosis",
        "ili" => "Flu-like Illness (ILI)",
        "asthma" => "Bronchial Asthma",
        _ => d,
    };

    public static string Category(string d) => d switch
    {
        "dengue" => "vector",
        "leptospirosis" => "waterborne",
        "ili" => "respiratory",
        "asthma" => "environmental",
        _ => "other",
    };

    private static (int Min, int Max) Range(string d) => d switch
    {
        "dengue" => (10, 25),
        "leptospirosis" => (3, 10),
        "ili" => (20, 45),
        "asthma" => (8, 18),
        _ => (1, 5),
    };

    private static string Csv(string v) =>
        v.Contains(',') || v.Contains('"') || v.Contains('\n') ? $"\"{v.Replace("\"", "\"\"")}\"" : v;

    // ponytail: one CSV through the real upload path; dedupe keys collide on re-run so seeding stays idempotent
    public static string BuildCsv(DateTime startMonday, Random rng)
    {
        var lines = new List<string> { string.Join(",", UploadTools.TemplateColumns) };
        for (int w = 0; w < DemoWeeks; w++)
        {
            var monday = startMonday.AddDays(-7 * w);
            var week = ISOWeek.GetWeekOfYear(monday);
            var year = ISOWeek.GetYear(monday);
            // ponytail: peak on recent weeks; clamped so magnitudes stay in Range()
            var peak = (double)(DemoWeeks - 1 - w) / (DemoWeeks - 1);
            for (int pi = 0; pi < Places.Length; pi++)
                for (int di = 0; di < Diseases.Length; di++)
                {
                    var p = Places[pi];
                    var d = Diseases[di];
                    var (min, max) = Range(d);
                    var cases = min + rng.Next(max - min + 1);
                    cases += (int)Math.Round((max - min) * 0.25 * peak);
                    if (cases > max) cases = max;
                    if (rng.NextDouble() < 0.04) cases = 0; // ponytail: occasional zero-case compliance row
                    int deaths = 0;
                    if (cases > 0 && (d == "dengue" || d == "leptospirosis") && rng.NextDouble() < 0.12)
                        deaths = rng.Next(0, Math.Min(cases, 1) + 1);
                    var under5 = cases == 0 ? 0 : rng.Next(0, cases + 1);
                    var male = cases == 0 ? 0 : rng.Next(0, cases + 1);
                    var submitted = monday.AddDays(6).ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
                    lines.Add(string.Join(",", new[]
                    {
                        week.ToString(CultureInfo.InvariantCulture), year.ToString(CultureInfo.InvariantCulture),
                        Csv(p.Province), Csv(p.Municipality), Csv(p.Barangay), Csv(p.SentinelFacility), "RHU",
                        d, cases.ToString(CultureInfo.InvariantCulture), deaths.ToString(CultureInfo.InvariantCulture),
                        under5.ToString(CultureInfo.InvariantCulture), (cases - under5).ToString(CultureInfo.InvariantCulture),
                        male.ToString(CultureInfo.InvariantCulture), (cases - male).ToString(CultureInfo.InvariantCulture),
                        Csv(Preparers[(pi + di + w) % Preparers.Length]), Contacts[(pi + di + w) % Contacts.Length], submitted,
                    }));
                }
        }
        return string.Join("\n", lines);
    }

    public static async Task EnsureAsync(HealthAlertDbContext ctx)
    {
        if (await ctx.Cases.AnyAsync()) return; // ponytail: real data always wins; demo only fills an empty DB
        await Seed.RunAsync(ctx);
        var rng = new Random(42);
        // ponytail: anchor on the most recent Monday (floored at 2026-09-28) so last-7d windows stay live
        var floor = new DateTime(2026, 9, 28);
        var today = DateTime.UtcNow.Date;
        var start = today < floor ? floor : today.AddDays(-(((int)today.DayOfWeek + 6) % 7));
        var csv = BuildCsv(start, rng);
        await new UploadTools(ctx).IngestAsync(csv, "mho-weekly-demo.csv", "demo-seeder", Feed);
    }
}
