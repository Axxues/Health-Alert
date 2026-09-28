using HealthAlert.Database;
using Microsoft.EntityFrameworkCore;

namespace HealthAlert.Tools;

public class SystemUserEditTools(HealthAlertDbContext ctx)
{
    public async Task EnsureSeededAsync()
    {
        if (!await ctx.Users.AnyAsync())
        {
            ctx.Users.Add(new TblUser { Username = "mho", Role = "MHO" });
            await ctx.SaveChangesAsync();
        }
    }
}
