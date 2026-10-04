using System.Globalization;
using System.Text;
using HealthAlert.Database;
using Microsoft.EntityFrameworkCore;

namespace HealthAlert.Tools;

public record UploadResult(long BatchId, int Accepted, int Quarantined, int Duplicates);

public class UploadTools(HealthAlertDbContext ctx)
{
    // ponytail: weekly PIDSR submission from the reporting unit (emailed upward to PHO/RESU); EDCS-IS encoding happens downstream
    public const string FeedCode = "mho-weekly";
    public const string DemoFeedCode = "mho-weekly-demo";
    public static readonly string[] TemplateColumns =
    [
        "morbidity_week", "morbidity_year", "province", "municipality", "barangay",
        "facility_name", "facility_type", "disease_code", "cases_this_week", "deaths_this_week",
        "age_under5", "age_5plus", "male", "female", "prepared_by", "contact", "date_submitted",
    ];
    private static readonly HashSet<string> Tracked = new(StringComparer.OrdinalIgnoreCase)
        { "dengue", "leptospirosis", "ili", "asthma" };
    private static readonly string[] Required =
        ["morbidity_week", "morbidity_year", "province", "municipality", "facility_name", "disease_code", "cases_this_week", "deaths_this_week"];

    public static string TemplateCsv() =>
        string.Join(",", TemplateColumns) + "\n# 39,2026,La Union,Agoo,Poblacion,Agoo RHU,RHU,dengue,5,0,1,4,3,2,J. Dela Cruz,09171234567,2026-10-01";

    // ponytail: hand-rolled split supporting quoted commas; CsvHelper if dialects grow
    public static List<string> SplitLine(string line)
    {
        var cols = new List<string>();
        var cur = new StringBuilder();
        bool q = false;
        for (int i = 0; i < line.Length; i++)
        {
            var ch = line[i];
            if (q)
            {
                if (ch == '"')
                {
                    if (i + 1 < line.Length && line[i + 1] == '"') { cur.Append('"'); i++; }
                    else q = false;
                }
                else cur.Append(ch);
            }
            else if (ch == '"') q = true;
            else if (ch == ',') { cols.Add(cur.ToString()); cur.Clear(); }
            else cur.Append(ch);
        }
        cols.Add(cur.ToString());
        return cols;
    }

    private static bool TryCount(string s, out int v) =>
        int.TryParse(s, NumberStyles.Integer, CultureInfo.InvariantCulture, out v) && v >= 0;

    public async Task<UploadResult> IngestAsync(string csv, string? fileName, string? uploadedBy, string? feedCode = null)
    {
        var lines = csv.Split(['\r', '\n'], StringSplitOptions.RemoveEmptyEntries)
            .Where(l => l.Trim().Length > 0 && !l.TrimStart().StartsWith('#')).ToList();
        if (lines.Count == 0) throw new InvalidDataException("empty csv");
        var header = SplitLine(lines[0]).Select(h => h.Trim()).ToList();
        foreach (var c in TemplateColumns)
            if (!header.Contains(c)) throw new InvalidDataException($"missing column {c}");
        var idx = TemplateColumns.ToDictionary(c => c, header.IndexOf);
        string Get(List<string> cols, string name) => idx[name] < cols.Count ? cols[idx[name]].Trim() : "";

        var now = DateTime.UtcNow;
        var nowWeek = ISOWeek.GetWeekOfYear(now);
        // ponytail: full SourceKey scan; fine at municipal volume, index lookup if uploads scale
        var seen = new HashSet<string>(
            await ctx.Cases.Where(c => c.SourceKey != null).Select(c => c.SourceKey!).ToListAsync(),
            StringComparer.OrdinalIgnoreCase);

        var batch = new TblUploadBatch { FileName = fileName, UploadedBy = uploadedBy, UploadedAt = now, Status = "clean" };
        await ctx.UploadBatches.AddAsync(batch);
        await ctx.SaveChangesAsync();

        var code = string.IsNullOrWhiteSpace(feedCode) ? FeedCode : feedCode;
        var feed = await ctx.Feeds.FirstOrDefaultAsync(f => f.Code == code);
        if (feed is null) { feed = new TblFeed { Code = code, Name = code }; await ctx.Feeds.AddAsync(feed); await ctx.SaveChangesAsync(); }
        var diseases = await ctx.Diseases.ToDictionaryAsync(d => d.Code ?? "", d => d.Id);

        int accepted = 0, quarantined = 0, duplicates = 0;
        foreach (var (line, n) in lines.Skip(1).Select((l, i) => (l, i + 1)))
        {
            var cols = SplitLine(line);
            var muni = Get(cols, "municipality");
            var facility = Get(cols, "facility_name");
            var disease = Get(cols, "disease_code").ToLowerInvariant();
            var weekOk = int.TryParse(Get(cols, "morbidity_week"), NumberStyles.Integer, CultureInfo.InvariantCulture, out var week);
            var yearOk = int.TryParse(Get(cols, "morbidity_year"), NumberStyles.Integer, CultureInfo.InvariantCulture, out var year);
            var casesOk = TryCount(Get(cols, "cases_this_week"), out var cases);
            var deathsOk = TryCount(Get(cols, "deaths_this_week"), out var deaths);
            var countsOk = casesOk && deathsOk
                && TryCount(Get(cols, "age_under5"), out _) && TryCount(Get(cols, "age_5plus"), out _)
                && TryCount(Get(cols, "male"), out _) && TryCount(Get(cols, "female"), out _);

            string reason =
                Required.Any(c => string.IsNullOrWhiteSpace(Get(cols, c))) ? "missing-required"
                : !weekOk || !yearOk || week < 1 || week > 53 || year < 2000 || year > 2100 ? "bad-week"
                : year > now.Year || (year == now.Year && week > nowWeek) ? "future-week"
                : !Tracked.Contains(Get(cols, "disease_code")) ? "unknown-disease"
                : !countsOk ? "negative-count"
                : deaths > cases ? "deaths-exceed-cases" : "";
            // ponytail: zero-case rows are compliance evidence, stored like any accepted row

            string? key = null;
            DateTime? monday = null;
            if (!string.IsNullOrWhiteSpace(muni) && !string.IsNullOrWhiteSpace(facility)
                && weekOk && yearOk && week >= 1 && week <= 53 && year >= 2000 && year <= 2100
                && !string.IsNullOrWhiteSpace(disease))
            {
                key = $"{muni}|{facility}|{year}-W{week:D2}|{disease}";
                monday = ISOWeek.ToDateTime(year, week, DayOfWeek.Monday);
            }

            if (reason == "")
            {
                if (!seen.Add(key!)) { duplicates++; continue; } // ponytail: in-batch + DB dedupe in one set
                await ctx.Cases.AddAsync(new TblCase
                {
                    FeedId = feed.Id,
                    DiseaseId = diseases.TryGetValue(disease, out var did) ? did : null,
                    SourceKey = key,
                    Count = cases, // ponytail: TblCase tracks cases only; deaths live on the issue row for review
                    ReportedAt = monday,
                });
                accepted++;
            }
            else
            {
                quarantined++;
                await ctx.UploadIssues.AddAsync(new TblUploadIssue
                {
                    BatchId = batch.Id, Row = n, Reason = reason, RawLine = line,
                    SourceKey = key, Disease = disease, Count = casesOk ? cases : null, ReportedAt = monday,
                });
            }
        }
        batch.Accepted = accepted; batch.Quarantined = quarantined; batch.Duplicates = duplicates;
        if (quarantined > 0) batch.Status = "reviewed";
        await ctx.SaveChangesAsync();
        return new UploadResult(batch.Id, accepted, quarantined, duplicates);
    }

    public async Task<List<TblUploadBatch>> BatchesAsync() =>
        await ctx.UploadBatches.OrderByDescending(b => b.Id).ToListAsync();

    public async Task<List<TblUploadIssue>> IssuesAsync(long batchId) =>
        await ctx.UploadIssues.Where(i => i.BatchId == batchId).OrderBy(i => i.Row).ToListAsync();

    public async Task<TblCase?> ResolveAsync(long issueId, bool accept)
    {
        var issue = await ctx.UploadIssues.FindAsync(issueId);
        if (issue is null || issue.Resolved) return null;
        if (!accept) { issue.Resolved = true; issue.Resolution = "discard"; await ctx.SaveChangesAsync(); return null; }
        // ponytail: accept is a human override (e.g. confirmed untracked disease); re-validated on dedupe only
        if (!string.IsNullOrWhiteSpace(issue.SourceKey)
            && await ctx.Cases.AnyAsync(c => c.SourceKey == issue.SourceKey))
        { issue.Resolved = true; issue.Resolution = "duplicate"; await ctx.SaveChangesAsync(); return null; }
        var feed = await ctx.Feeds.FirstOrDefaultAsync(f => f.Code == FeedCode);
        if (feed is null) { feed = new TblFeed { Code = FeedCode, Name = FeedCode }; await ctx.Feeds.AddAsync(feed); }
        long? did = null;
        if (!string.IsNullOrWhiteSpace(issue.Disease))
            did = (await ctx.Diseases.FirstOrDefaultAsync(d => d.Code == issue.Disease))?.Id;
        var c = new TblCase
        {
            FeedId = feed.Id, DiseaseId = did,
            SourceKey = issue.SourceKey ?? $"mho-weekly|resolve-{issue.Id}", // ponytail: fallback key; hotspot muni-parse degrades, row still countable
            Count = issue.Count ?? 0, ReportedAt = issue.ReportedAt ?? DateTime.UtcNow,
        };
        await ctx.Cases.AddAsync(c);
        issue.Resolved = true; issue.Resolution = "accept";
        await ctx.SaveChangesAsync();
        return c;
    }
}
