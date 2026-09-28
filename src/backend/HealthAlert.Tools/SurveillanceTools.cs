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
        var key = body.ValueKind == JsonValueKind.Object && body.TryGetProperty("sourceKey", out var k)
            ? k.GetString() ?? body.ToString()
            : body.ToString();
        var existing = await ctx.Cases.FirstOrDefaultAsync(c => c.SourceKey == key);
        if (existing is not null) return existing; // ponytail: sourceKey check in app; DB unique index if dupes appear under concurrency
        var f = await ctx.Feeds.FirstOrDefaultAsync(x => x.Code == feed);
        if (f is null) { f = new TblFeed { Code = feed, Name = feed }; await ctx.Feeds.AddAsync(f); await ctx.SaveChangesAsync(); }
        var c = new TblCase { FeedId = f.Id, SourceKey = key, ReportedAt = DateTime.UtcNow };
        await ctx.Cases.AddAsync(c);
        await ctx.SaveChangesAsync();
        return c;
    }
}
