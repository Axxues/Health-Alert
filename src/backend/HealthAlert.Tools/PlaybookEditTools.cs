using HealthAlert.Database;

namespace HealthAlert.Tools;

public class PlaybookEditTools(HealthAlertDbContext ctx)
{
    public async Task<TblPlaybookExecution> ExecuteAsync(long id)
    {
        var e = new TblPlaybookExecution { PlaybookId = id, Status = "done", Log = $"executed {id}" };
        await ctx.PlaybookExecutions.AddAsync(e);
        await ctx.SaveChangesAsync();
        return e;
    }
}
