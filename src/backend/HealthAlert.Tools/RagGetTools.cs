using HealthAlert.Database;
using Microsoft.EntityFrameworkCore;

namespace HealthAlert.Tools;

public class RagGetTools(HealthAlertDbContext ctx)
{
    // ponytail: answers come only from seeded DOH/WHO guideline docs; keyword match until a vector index is warranted
    public async Task<object> AskAsync(string? q)
    {
        await Seed.RunAsync(ctx);
        var words = (q ?? "").ToLower().Split([' ', ',', '.', '?', '!'], StringSplitOptions.RemoveEmptyEntries)
            .Where(w => w.Length > 2).ToArray();
        var docs = await ctx.RagDocs.Where(d => d.Source == "DOH" || d.Source == "WHO").ToListAsync();
        var hit = docs
            .Select(d => (doc: d, score: words.Count(w => $"{d.Doc} {d.Chapter} {d.Content}".ToLower().Contains(w))))
            .OrderByDescending(x => x.score).FirstOrDefault();
        if (hit.doc is null || hit.score == 0)
            return new { answer = "No DOH/WHO guideline on this topic is in the index yet.", citations = Array.Empty<object>() };
        var d0 = hit.doc;
        return new { answer = d0.Content, citations = new[] { new { doc = d0.Doc, chapter = d0.Chapter, page = d0.Page, source = d0.Source } } };
    }
}
