using System.Text.Json;
using HealthAlert.Common;
using HealthAlert.Tools;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HealthAlert.Api.Controllers;

[ApiController, Route("api/surveillance"), Authorize]
public class SurveillanceController(IConfiguration cfg, IHostEnvironment env) : ControllerBase
{
    [HttpGet("feeds")]
    public async Task<IActionResult> Feeds([FromServices] SurveillanceGetTools g) =>
        Ok(ApiResponse.Ok(await g.FeedsAsync()));

    [AllowAnonymous, HttpPost("ingest/{feed}")] // ponytail: cron-key auth, not JWT — automation has no session
    public async Task<IActionResult> Ingest(string feed, [FromBody] JsonElement b,
        [FromServices] SurveillanceEditTools e, [FromHeader(Name = CronAuth.Header)] string? k)
    {
        var exp = CronAuth.Expected(cfg, env.IsDevelopment());
        if (exp is null) return StatusCode(500, ApiResponse.Fail("CONFIG", "Cron:Key missing"));
        if (k != exp) return Unauthorized();
        try { return Ok(ApiResponse.Ok(await e.IngestAsync(feed, b))); }
        catch (InvalidDataException ex) { await e.DeadLetterAsync(feed, b.ToString()); return BadRequest(ApiResponse.Fail("BAD_REQUEST", ex.Message)); }
    }
}
