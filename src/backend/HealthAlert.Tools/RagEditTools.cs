using HealthAlert.Database;
using Microsoft.EntityFrameworkCore;

namespace HealthAlert.Tools;

public class RagEditTools(HealthAlertDbContext ctx)
{
    public async Task<object> ReindexAsync()
    {
        if (!await ctx.RagDocs.AnyAsync())
        {
            ctx.RagDocs.Add(new TblRagDoc { Doc = "Dengue Clinical Bulletin", Chapter = "Fluid Management", Page = "p.12", Content = "Give oral fluids early." });
            await ctx.SaveChangesAsync();
        }
        return new { docs = await ctx.RagDocs.CountAsync() };
    }
}
