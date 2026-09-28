using HealthAlert.Database;
using Microsoft.EntityFrameworkCore;

namespace HealthAlert.Tools;

public class RagGetTools(HealthAlertDbContext ctx)
{
    public async Task<object> AskAsync(string? q)
    {
        if (!await ctx.RagDocs.AnyAsync())
        {
            ctx.RagDocs.Add(new TblRagDoc { Doc = "Dengue Clinical Bulletin", Chapter = "Fluid Management", Page = "p.12", Content = "Give oral fluids early." });
            await ctx.SaveChangesAsync();
        }
        var d = await ctx.RagDocs.FirstAsync();
        return new { answer = $"Stub answer for: {q}", citations = new[] { new { doc = d.Doc, chapter = d.Chapter, page = d.Page } } };
    }
}
