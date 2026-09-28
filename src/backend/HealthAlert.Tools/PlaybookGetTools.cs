using HealthAlert.Database;
using Microsoft.EntityFrameworkCore;

namespace HealthAlert.Tools;

public class PlaybookGetTools(HealthAlertDbContext ctx)
{
    public async Task<List<TblPlaybook>> ListAsync()
    {
        if (!await ctx.Playbooks.AnyAsync())
        {
            ctx.Playbooks.AddRange(new TblPlaybook { Code = "dengue-outbreak", Title = "Dengue Outbreak Response" }, new TblPlaybook { Code = "flood-lepto", Title = "Flood Lepto Response" });
            await ctx.SaveChangesAsync();
        }
        return await ctx.Playbooks.OrderBy(p => p.Id).ToListAsync();
    }
}
