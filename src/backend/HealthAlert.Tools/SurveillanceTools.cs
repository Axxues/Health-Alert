using System.Text.Json;
using HealthAlert.Database;
using Microsoft.EntityFrameworkCore;

namespace HealthAlert.Tools;

// ponytail: one file for both surveillance tools; split Get/Edit when a second domain lands
public class SurveillanceGetTools(HealthAlertDbContext ctx)
{
    public async Task<List<TblFeed>> FeedsAsync() =>
        await ctx.Feeds.OrderBy(f => f.Id).ToListAsync();
}

public class SurveillanceEditTools(HealthAlertDbContext ctx)
{
    public async Task<TblCase> IngestAsync(string feed, JsonElement body)
    {
        if (body.ValueKind != JsonValueKind.Object || !body.TryGetProperty("sourceKey", out var k)
            || string.IsNullOrWhiteSpace(k.GetString()))
            throw new InvalidDataException("sourceKey required"); // ponytail: strict key only; schema-validate if feeds diverge
        var key = k.GetString()!;
        var existing = await ctx.Cases.FirstOrDefaultAsync(c => c.SourceKey == key);
        if (existing is not null) return existing; // ponytail: sourceKey check in app; DB unique index if dupes appear under concurrency
        var f = await ctx.Feeds.FirstOrDefaultAsync(x => x.Code == feed);
        if (f is null) { f = new TblFeed { Code = feed, Name = feed }; await ctx.Feeds.AddAsync(f); await ctx.SaveChangesAsync(); }
        double count = 1;
        if (body.TryGetProperty("count", out var cv) && cv.TryGetDouble(out var v)) count = v;
        long? diseaseId = null;
        if (body.TryGetProperty("disease", out var dv))
        {
            var code = dv.GetString();
            var d = await ctx.Diseases.FirstOrDefaultAsync(x => x.Code == code);
            diseaseId = d?.Id;
        }
        var c = new TblCase { FeedId = f.Id, DiseaseId = diseaseId, SourceKey = key, Count = count, ReportedAt = DateTime.UtcNow };
        await ctx.Cases.AddAsync(c);
        await ctx.SaveChangesAsync();
        return c;
    }

    public async Task DeadLetterAsync(string feed, string payload)
    {
        ctx.AuditTrail.Add(new TblAuditTrail { Action = $"ingest.dead-letter:{feed}", CreatedAt = DateTime.UtcNow });
        ctx.Outbox.Add(new TblOutbox { IdempotencyKey = $"dlq:{feed}:{Guid.NewGuid()}", Payload = payload });
        await ctx.SaveChangesAsync();
    }
}
