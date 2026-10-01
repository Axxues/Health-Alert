using System.Security.Claims;
using HealthAlert.Api.Controllers;
using HealthAlert.Tools;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HealthAlert.Tests;

public class AlertBroadcastTest
{
    [Fact]
    public async Task Broadcast_writes_alert_and_outbox()
    {
        var ctx = TestDb.Create();
        var a = await new AlertsEditTools(ctx).BroadcastAsync("Agoo", "Fever lane open", "SOP-CLN-04");
        Assert.Equal("manual", a.Kind);
        Assert.Equal("new", a.Status);
        Assert.Equal(1, await ctx.Outbox.CountAsync());
    }

    [Fact]
    public async Task Broadcast_endpoint_rejects_viewer()
    {
        var ctx = TestDb.Create();
        var c = new AlertsController(new AlertsGetTools(ctx), new AlertsEditTools(ctx), TestCfg.Config(), TestCfg.Env());
        var viewer = new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.Role, "Viewer")], "test"));
        c.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext { User = viewer } };
        var r = await c.Broadcast(new BroadcastReq("Agoo", "Fever lane open", "SOP-CLN-04"));
        Assert.IsType<ForbidResult>(r);
    }
}
