using HealthAlert.Database;
using Microsoft.EntityFrameworkCore;

namespace HealthAlert.Tools;

public class SurveillanceGetTools(HealthAlertDbContext ctx)
{
    public async Task<List<TblFeed>> FeedsAsync() =>
        await ctx.Feeds.OrderBy(f => f.Id).ToListAsync();
}
