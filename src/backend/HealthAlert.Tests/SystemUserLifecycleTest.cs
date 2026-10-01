using HealthAlert.Database;
using HealthAlert.Tools;

namespace HealthAlert.Tests;

public class SystemUserLifecycleTest
{
    [Fact]
    public async Task Create_rejects_unknown_role()
    {
        var ctx = TestDb.Create();
        await Assert.ThrowsAsync<InvalidOperationException>(() => new SystemUserEditTools(ctx).CreateAsync("nurse1", "Superuser"));
    }

    [Fact]
    public async Task Deactivate_hides_user_from_listing()
    {
        var ctx = TestDb.Create();
        var tools = new SystemUserEditTools(ctx);
        var u = await tools.CreateAsync("midwife1", "Viewer");
        await tools.SetActiveAsync(u.Id, false);
        Assert.False((await ctx.Users.FindAsync(u.Id))!.IsActive);
    }

    [Fact]
    public async Task Listing_excludes_deactivated_users()
    {
        var ctx = TestDb.Create();
        var tools = new SystemUserEditTools(ctx);
        var u = await tools.CreateAsync("midwife2", "Viewer");
        await tools.SetActiveAsync(u.Id, false);
        Assert.DoesNotContain(await new SystemUserGetTools(ctx).ListAsync(), x => x.Id == u.Id);
    }

    [Fact]
    public async Task Role_change_persists()
    {
        var ctx = TestDb.Create();
        var tools = new SystemUserEditTools(ctx);
        var u = await tools.CreateAsync("epi1", "Viewer");
        await tools.SetRoleAsync(u.Id, "Admin");
        Assert.Equal("Admin", (await ctx.Users.FindAsync(u.Id))!.Role);
    }
}
