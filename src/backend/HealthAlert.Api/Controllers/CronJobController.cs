using HealthAlert.Common;
using Microsoft.AspNetCore.Mvc;

namespace HealthAlert.Api.Controllers;

[ApiController, Route("api/cron")]
public class CronJobController : ControllerBase
{
    [HttpPost("tick")]
    public IActionResult Tick([FromHeader(Name = "X-Cron-Key")] string? k)
    {
        if (k != "dev-cron-key") return Unauthorized();
        return Ok(ApiResponse.Ok(new { ticked = true, at = DateTime.UtcNow }));
    }
}
