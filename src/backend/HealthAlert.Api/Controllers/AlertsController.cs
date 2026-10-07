using System.Text.Json;
using HealthAlert.Common;
using HealthAlert.Database;
using HealthAlert.Tools;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HealthAlert.Api.Controllers;

[ApiController, Route("api/alerts"), Authorize]
public class AlertsController(AlertsGetTools g, AlertsEditTools e, IConfiguration cfg, IHostEnvironment env) : ControllerBase
{
    [AllowAnonymous, HttpGet]
    public async Task<IActionResult> List([FromHeader(Name = CronAuth.Header)] string? k)
    {
        var exp = CronAuth.Expected(cfg, env.IsDevelopment());
        if (User.Identity?.IsAuthenticated != true && k != exp && !env.IsDevelopment())
            return Unauthorized();
        return Ok(ApiResponse.Ok(await g.ListAsync()));
    }

    [HttpPost("{id}/ack")]
    public async Task<IActionResult> Ack(long id) =>
        await e.AckAsync(id) is { } a ? Ok(ApiResponse.Ok(a)) : NotFound();

    [HttpPost("broadcast")]
    public async Task<IActionResult> Broadcast(BroadcastReq req)
    {
        if (!User.IsInRole("Admin")) return Forbid();
        return Ok(ApiResponse.Ok(await e.BroadcastAsync(req.Muni, req.Message, req.PlaybookCode)));
    }

    [AllowAnonymous, HttpPost]
    public async Task<IActionResult> Create([FromBody] JsonElement b,
        [FromServices] HealthAlertDbContext ctx, [FromHeader(Name = CronAuth.Header)] string? k)
    {
        var exp = CronAuth.Expected(cfg, env.IsDevelopment());
        if (User.Identity?.IsAuthenticated != true && k != exp && !env.IsDevelopment())
            return Unauthorized();
        string message = "Workflow failure detected";
        string title = "System Alert";
        if (b.ValueKind == JsonValueKind.Object)
        {
            if (b.TryGetProperty("message", out var mv)) message = mv.GetString() ?? message;
            if (b.TryGetProperty("title", out var tv)) title = tv.GetString() ?? title;
        }
        else
        {
            message = b.ToString();
        }
        var alert = new TblAlert { Kind = "auto", Message = message, Status = "new" };
        await ctx.Alerts.AddAsync(alert);
        await ctx.SaveChangesAsync();
        return Ok(ApiResponse.Ok(alert));
    }
}

public record BroadcastReq(string Muni, string Message, string? PlaybookCode);
