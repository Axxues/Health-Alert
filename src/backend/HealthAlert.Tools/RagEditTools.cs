using HealthAlert.Database;
using Microsoft.EntityFrameworkCore;

namespace HealthAlert.Tools;

public class RagEditTools(HealthAlertDbContext ctx)
{
    public async Task<object> ReindexAsync()
    {
        await Seed.RunAsync(ctx); // ponytail: single curated DOH/WHO corpus; no external fetch until sources are approved
        return new { docs = await ctx.RagDocs.CountAsync() };
    }
}
