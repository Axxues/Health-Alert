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

    public async Task<TblUser> CreateAsync(string username, string role)
    {
        if (role is not ("Admin" or "Viewer" or "Encoder")) throw new InvalidOperationException($"unknown role {role}");
        var u = new TblUser { Username = username, Role = role, IsActive = true };
        ctx.Users.Add(u);
        await ctx.SaveChangesAsync();
        return u;
    }

    public async Task<TblUser?> SetActiveAsync(long id, bool active)
    {
        var u = await ctx.Users.FindAsync(id);
        if (u is null) return null;
        u.IsActive = active;
        await ctx.SaveChangesAsync();
        return u;
    }

    public async Task<TblUser?> SetRoleAsync(long id, string role)
    {
        if (role is not ("Admin" or "Viewer" or "Encoder")) throw new InvalidOperationException($"unknown role {role}");
        var u = await ctx.Users.FindAsync(id);
        if (u is null) return null;
        u.Role = role;
        await ctx.SaveChangesAsync();
        return u;
    }
}
