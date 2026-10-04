using HealthAlert.Database;
using HealthAlert.Tools;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace HealthAlert.Tests;

public class RagSourceTest
{
    [Fact]
    public async Task Seed_contains_only_doh_who_guideline_docs()
    {
        var ctx = TestDb.Create();
        await Seed.RunAsync(ctx);
        Assert.True(await ctx.RagDocs.AnyAsync());
        Assert.All(await ctx.RagDocs.ToListAsync(), d =>
            Assert.True(d.Source == "DOH" || d.Source == "WHO", $"Non-curated source: {d.Source}"));
    }

    [Fact]
    public async Task Ask_never_cites_non_doh_who_docs()
    {
        var ctx = TestDb.Create();
        await Seed.RunAsync(ctx);
        ctx.RagDocs.Add(new TblRagDoc { Doc = "Random Blog", Chapter = "X", Page = "p.1", Content = "doxycycline cures everything", Source = "Blog" });
        await ctx.SaveChangesAsync();

        var json = JsonSerializer.Serialize(await new RagGetTools(ctx).AskAsync("doxycycline prophylaxis leptospirosis"));
        Assert.DoesNotContain("Random Blog", json);
        Assert.True(json.Contains("DOH") || json.Contains("WHO"));
    }
}
