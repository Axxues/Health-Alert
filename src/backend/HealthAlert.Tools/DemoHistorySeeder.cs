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
        new("Dagupan City", "Pangasinan", "Lucao", "Region 1 Medical Center (R1MC)", 16.0350, 120.3150),
        new("Lingayen", "Pangasinan", "Poblacion", "Lingayen District Hospital", 16.0222, 120.2319),
        new("Vigan City", "Ilocos Sur", "Pantay Daya", "Gabriela Silang General Hospital", 17.5680, 120.3820),
        new("Laoag City", "Ilocos Norte", "Nalbo", "Laoag City Health Office", 18.1880, 120.5840),
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
