using System.Globalization;
using HealthAlert.Database;
using Microsoft.EntityFrameworkCore;

namespace HealthAlert.Tools;

public record PopRow(string Province, string Municipality, string Barangay, long Population, int RefYear, string Source);
public record PopUploadResult(int Accepted, int Errors, List<string> ErrorLines);

public class PopulationTools(HealthAlertDbContext ctx)
{
    public const string Header = "province,municipality,barangay,population,reference_year,source";
    private static readonly string[] Expected = ["province", "municipality", "barangay", "population", "reference_year", "source"];
    private static readonly HashSet<string> Sources = new(StringComparer.OrdinalIgnoreCase) { "census", "cbms", "rhu-record", "other" };

    public static string TemplateCsv() =>
        Header + "\nLa Union,Agoo,Poblacion,5000,2024,census";

    public static (List<PopRow> valid, List<string> errors) ParseValidateCsv(string csv)
    {
        var valid = new List<PopRow>();
        var errors = new List<string>();
        var lines = (csv ?? "").Split(['\r', '\n'], StringSplitOptions.RemoveEmptyEntries)
            .Where(l => l.Trim().Length > 0 && !l.TrimStart().StartsWith('#')).ToList();
        if (lines.Count == 0) return (valid, ["empty csv"]);
        var header = UploadTools.SplitLine(lines[0]).Select(h => h.Trim()).ToList();
        // ponytail: exact header match; anything else is a format error, not a row error
        if (header.Count != Expected.Length || Expected.Where((e, i) => !string.Equals(header[i], e, StringComparison.Ordinal)).Any())
            return (valid, [$"bad header: expected {Header}"]);
        foreach (var (line, i) in lines.Skip(1).Select((l, i) => (l, i)))
        {
            var n = i + 2; // ponytail: file line number, header is line 1
            var cols = UploadTools.SplitLine(line);
            string Get(int k) => k < cols.Count ? cols[k].Trim() : "";
            var prov = Get(0); var muni = Get(1); var brgy = Get(2);
            var popS = Get(3); var yearS = Get(4); var src = Get(5);
            string? err = null;
            if (cols.Count != 6) err = $"line {n}: expected 6 columns";
            else if (string.IsNullOrWhiteSpace(prov) || string.IsNullOrWhiteSpace(muni) || string.IsNullOrWhiteSpace(brgy) || string.IsNullOrWhiteSpace(src)) err = $"line {n}: blank field";
            else if (!long.TryParse(popS, NumberStyles.Integer, CultureInfo.InvariantCulture, out var pop) || pop <= 0) err = $"line {n}: bad population";
            else if (!int.TryParse(yearS, NumberStyles.Integer, CultureInfo.InvariantCulture, out var year) || year < 2000 || year > 2100) err = $"line {n}: bad reference_year";
            else if (!Sources.Contains(src)) err = $"line {n}: unknown source";
            if (err is not null) { errors.Add(err); continue; }
            valid.Add(new PopRow(prov, muni, brgy,
                long.Parse(popS.Trim(), NumberStyles.Integer, CultureInfo.InvariantCulture),
                int.Parse(yearS.Trim(), NumberStyles.Integer, CultureInfo.InvariantCulture),
                src.Trim().ToLowerInvariant()));
        }
        return (valid, errors);
    }

    // ponytail: full key scan; fine at barangay volume, indexed lookup if uploads scale
    public async Task<PopUploadResult> ImportAsync(List<PopRow> rows, string? uploadedBy)
    {
        if (rows.Count == 0) return new PopUploadResult(0, 0, []);
        var existing = await ctx.PlacePopulations.ToListAsync();
        var now = DateTime.UtcNow;
        foreach (var r in rows)
        {
            var hit = existing.FirstOrDefault(p =>
                string.Equals(p.Province ?? "", r.Province, StringComparison.OrdinalIgnoreCase) &&
                string.Equals(p.Municipality ?? "", r.Municipality, StringComparison.OrdinalIgnoreCase) &&
                string.Equals(p.Barangay ?? "", r.Barangay, StringComparison.OrdinalIgnoreCase) &&
                p.RefYear == r.RefYear);
            if (hit is not null)
            {
                hit.Province = r.Province; hit.Municipality = r.Municipality; hit.Barangay = r.Barangay;
                hit.Population = r.Population; hit.Source = r.Source;
                hit.UploadedBy = uploadedBy; hit.UpdatedAt = now;
            }
            else
            {
                var e = new TblPlacePopulation
                {
                    Province = r.Province, Municipality = r.Municipality, Barangay = r.Barangay,
                    Population = r.Population, RefYear = r.RefYear, Source = r.Source,
                    UploadedBy = uploadedBy, UpdatedAt = now,
                };
                await ctx.PlacePopulations.AddAsync(e);
                existing.Add(e);
            }
        }
        await ctx.SaveChangesAsync();
        return new PopUploadResult(rows.Count, 0, []);
    }

    public async Task<List<TblPlacePopulation>> QueryAsync(string? province, string? municipality, string? barangay)
    {
        var q = ctx.PlacePopulations.AsQueryable();
        if (!NoFilter(province)) q = q.Where(p => p.Province != null && p.Province.Contains(province!));
        if (!NoFilter(municipality)) q = q.Where(p => p.Municipality != null && p.Municipality.Contains(municipality!));
        if (!NoFilter(barangay)) q = q.Where(p => p.Barangay != null && p.Barangay.Contains(barangay!));
        return await q.OrderByDescending(p => p.RefYear).ThenByDescending(p => p.Id).ToListAsync();
    }

    private static bool NoFilter(string? v) => string.IsNullOrWhiteSpace(v) || v.Equals("all", StringComparison.OrdinalIgnoreCase);
}
