using HealthAlert.Database;
using Microsoft.EntityFrameworkCore;

namespace HealthAlert.Tools;

public class SystemUserGetTools(HealthAlertDbContext ctx)
{
    public async Task<List<TblUser>> ListAsync() =>
        await ctx.Users.Where(u => u.IsActive).OrderBy(u => u.Id).ToListAsync();
}
