using HealthAlert.Common;
using HealthAlert.Database;
using HealthAlert.Tools;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HealthAlert.Api.Controllers;

[ApiController, Route("api/system"), Authorize]
public class SystemController(SystemGetTools t, IConfiguration cfg, IHostEnvironment env) : ControllerBase
{
    [HttpGet("status")]
    public IActionResult Status() => Ok(ApiResponse.Ok(t.Status()));

    [AllowAnonymous, HttpGet("outbox")]
    public async Task<IActionResult> Outbox([FromServices] HealthAlertDbContext ctx, [FromHeader(Name = CronAuth.Header)] string? k)
    {
        var exp = CronAuth.Expected(cfg, env.IsDevelopment());
        if (User.Identity?.IsAuthenticated != true && k != exp && !env.IsDevelopment())
            return Unauthorized();
        var pending = await ctx.Outbox.OrderBy(x => x.Id).Take(25).ToListAsync();
        return Ok(ApiResponse.Ok(new { count = pending.Count, items = pending }));
    }
}
