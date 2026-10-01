using System.Globalization;
using System.Text.Json;
using HealthAlert.Database;
using Microsoft.EntityFrameworkCore;

namespace HealthAlert.Tools;

// ponytail: demo place directory lives here so seeder + locations endpoint share it;
// names/facilities/coords mirror frontend riskmaps.api.ts (RiskMapsGetTools has no barangay/facility/Lingayen data)
public record DemoPlace(string Municipality, string Province, string Barangay, string SentinelFacility, double Lat, double Lng);

public static class DemoHistorySeeder
{
    public const string Feed = "pidsr-demo";
    public static readonly string[] Diseases = ["dengue", "leptospirosis", "ili", "asthma"];

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

    private static int Base(string d) => d switch { "dengue" => 18, "leptospirosis" => 8, "ili" => 30, "asthma" => 12, _ => 5 };

    public static async Task EnsureAsync(HealthAlertDbContext ctx)
    {
        if (await ctx.Cases.AnyAsync()) return; // ponytail: real data always wins; demo only fills an empty DB
        await Seed.RunAsync(ctx);
        var tools = new SurveillanceEditTools(ctx);
        var rng = new Random(42);
        // ponytail: anchor on the most recent Monday (floored at 2026-09-28) so last-7d windows stay live
        var floor = new DateTime(2026, 9, 28);
        var today = DateTime.UtcNow.Date;
        var start = today < floor ? floor : today.AddDays(-(((int)today.DayOfWeek + 6) % 7));
        for (int w = 0; w < 12; w++)
        {
            var monday = start.AddDays(-7 * w);
            var week = ISOWeek.GetWeekOfYear(monday);
            foreach (var p in Places)
                foreach (var d in Diseases)
                {
                    // ponytail: "-{disease}" suffix keeps SourceKey unique per disease-week; muni prefix stays parseable
                    var key = $"{p.Municipality}|{monday.Year}-W{week:D2}-{d}";
                    var count = Math.Max(0, (int)Math.Round(Base(d) * (1 + 0.6 * Math.Sin(w / 11.0 * Math.PI)) * (0.85 + 0.3 * rng.NextDouble())));
                    using var doc = JsonDocument.Parse(JsonSerializer.Serialize(new { sourceKey = key, disease = d, count }));
                    var row = (TblCase)await tools.IngestAsync(Feed, doc.RootElement);
                    row.ReportedAt = monday;
                }
        }
        await ctx.SaveChangesAsync();
    }
}
