using HealthAlert.Database;
using Microsoft.EntityFrameworkCore;

namespace HealthAlert.Tools;

public class AlertsGetTools(HealthAlertDbContext ctx)
{
    public async Task<List<TblAlert>> ListAsync()
    {
        if (!await ctx.Alerts.AnyAsync())
        {
            ctx.Alerts.Add(new TblAlert { Kind = "auto", Muni = "San Fernando City", Disease = "dengue", DiseaseId = 1, Message = "Dengue hotspot: Brgy San Roque", Status = "new" });
            await ctx.SaveChangesAsync();
        }
        return await ctx.Alerts.OrderBy(a => a.Id).ToListAsync();
    }
}
