using HealthAlert.Database;
using Microsoft.EntityFrameworkCore;

namespace HealthAlert.Tools;

// ponytail: one file for Task 4 stub tools; split per-domain when logic grows
public class RagTools(HealthAlertDbContext ctx)
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

    public async Task<object> ReindexAsync()
    {
        await AskAsync("seed");
        return new { docs = await ctx.RagDocs.CountAsync() };
    }
}

public class PlaybookTools(HealthAlertDbContext ctx)
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

    public async Task<TblPlaybookExecution> ExecuteAsync(long id)
    {
        var e = new TblPlaybookExecution { PlaybookId = id, Status = "done", Log = $"executed {id}" };
        await ctx.PlaybookExecutions.AddAsync(e);
        await ctx.SaveChangesAsync();
        return e;
    }
}

public class AlertsTools(HealthAlertDbContext ctx)
{
    public async Task<List<TblAlert>> ListAsync()
    {
        if (!await ctx.Alerts.AnyAsync())
        {
            ctx.Alerts.Add(new TblAlert { DiseaseId = 1, Message = "Dengue hotspot: Brgy San Roque", Status = "new" });
            await ctx.SaveChangesAsync();
        }
        return await ctx.Alerts.OrderBy(a => a.Id).ToListAsync();
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
