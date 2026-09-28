using System.Text.Json;
using HealthAlert.Database;
using Microsoft.EntityFrameworkCore;

namespace HealthAlert.Tools;

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
        try
        {
            await ctx.Cases.AddAsync(c);
            await ctx.SaveChangesAsync();
        }
        catch (DbUpdateException) // ponytail: lost the race on IX_tblCases_SourceKey; return the winner (idempotent)
        {
            ctx.Entry(c).State = EntityState.Detached;
            var winner = await ctx.Cases.FirstOrDefaultAsync(x => x.SourceKey == key);
            if (winner is not null) return winner;
            throw;
        }
        return c;
    }

    public async Task DeadLetterAsync(string feed, string payload)
    {
        ctx.AuditTrail.Add(new TblAuditTrail { Action = $"ingest.dead-letter:{feed}", CreatedAt = DateTime.UtcNow });
        ctx.Outbox.Add(new TblOutbox { IdempotencyKey = $"dlq:{feed}:{Guid.NewGuid()}", Payload = payload });
        await ctx.SaveChangesAsync();
    }
}
