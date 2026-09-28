using HealthAlert.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HealthAlert.Api.Controllers;

[ApiController, Route("api/cron"), Authorize]
public class CronJobController(IConfiguration cfg, IHostEnvironment env) : ControllerBase
{
    [AllowAnonymous, HttpPost("tick")] // ponytail: cron-key auth, not JWT — automation has no session
    public IActionResult Tick([FromHeader(Name = CronAuth.Header)] string? k)
    {
        var exp = CronAuth.Expected(cfg, env.IsDevelopment());
        if (exp is null) return StatusCode(500, ApiResponse.Fail("CONFIG", "Cron:Key missing"));
        if (k != exp) return Unauthorized();
        return Ok(ApiResponse.Ok(new { ticked = true, at = DateTime.UtcNow }));
    }
}
