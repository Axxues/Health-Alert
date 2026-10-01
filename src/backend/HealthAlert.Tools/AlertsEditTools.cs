using HealthAlert.Database;

namespace HealthAlert.Tools;

public class AlertsEditTools(HealthAlertDbContext ctx)
{
    public async Task<TblAlert> BroadcastAsync(string muni, string message, string? playbookCode)
    {
        var a = new TblAlert { Kind = "manual", Muni = muni, Message = message, PlaybookCode = playbookCode, Status = "new" };
        await ctx.Alerts.AddAsync(a);
        await ctx.Outbox.AddAsync(new TblOutbox { IdempotencyKey = $"broadcast-{Guid.NewGuid()}", Payload = message });
        await ctx.SaveChangesAsync();
        return a;
    }
    public async Task<TblAlert?> AckAsync(long id)
    {
        var a = await ctx.Alerts.FindAsync(id);
        if (a is null) return null;
        a.Status = "acked";
        await ctx.SaveChangesAsync();
        return a;
    }
}
