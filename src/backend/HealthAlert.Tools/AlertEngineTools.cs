using HealthAlert.Database;
using Microsoft.EntityFrameworkCore;

namespace HealthAlert.Tools;

public record AlertReport(int Opened, int Resolved);

public class AlertEngineTools(HealthAlertDbContext ctx)
{
    public async Task<AlertReport> EvaluateAsync(List<(string Muni, string Disease, string Level)> hotspots)
    {
        int opened = 0, resolved = 0;
        var highs = hotspots.Where(h => h.Level == "high").ToList();
        foreach (var h in highs)
        {
            bool open = await ctx.Alerts.AnyAsync(a => a.Muni == h.Muni && a.Disease == h.Disease && a.Kind == "auto" && (a.Status == "new" || a.Status == "acked"));
            if (open) continue;
            ctx.Alerts.Add(new TblAlert { Kind = "auto", Muni = h.Muni, Disease = h.Disease, Status = "new",
                Message = $"{h.Disease} entered High risk in {h.Muni}" });
            opened++;
        }
        var keys = highs.Select(h => h.Muni + "|" + h.Disease).ToHashSet();
        foreach (var a in await ctx.Alerts.Where(a => a.Kind == "auto" && a.Status != "resolved").ToListAsync())
        {
            if (!keys.Contains(a.Muni + "|" + a.Disease)) { a.Status = "resolved"; resolved++; }
        }
        await ctx.SaveChangesAsync();
        return new AlertReport(opened, resolved);
    }
}
