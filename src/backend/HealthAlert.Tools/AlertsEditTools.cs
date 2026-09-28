using HealthAlert.Database;

namespace HealthAlert.Tools;

public class AlertsEditTools(HealthAlertDbContext ctx)
{
    public async Task<TblAlert?> AckAsync(long id)
    {
        var a = await ctx.Alerts.FindAsync(id);
        if (a is null) return null;
        a.Status = "acked";
        await ctx.SaveChangesAsync();
        return a;
    }
}
