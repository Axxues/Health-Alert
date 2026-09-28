using System.Text.Json;
using HealthAlert.Common;
using HealthAlert.Database;
using HealthAlert.Tools;
using Microsoft.AspNetCore.Mvc;

namespace HealthAlert.Api.Controllers;

[ApiController, Route("api/surveillance")]
public class SurveillanceController : ControllerBase
{
    [HttpGet("feeds")]
    public async Task<IActionResult> Feeds([FromServices] SurveillanceGetTools g) =>
        Ok(ApiResponse.Ok(await g.FeedsAsync()));

    [HttpPost("ingest/{feed}")]
    public async Task<IActionResult> Ingest(string feed, [FromBody] JsonElement b,
        [FromServices] SurveillanceEditTools e, [FromHeader(Name = "X-Cron-Key")] string? k)
    {
        if (k != "dev-cron-key") return Unauthorized();
        try { return Ok(ApiResponse.Ok(await e.IngestAsync(feed, b))); }
        catch (InvalidDataException ex) { await e.DeadLetterAsync(feed, b.ToString()); return BadRequest(ApiResponse.Fail("BAD_REQUEST", ex.Message)); }
    }
}
