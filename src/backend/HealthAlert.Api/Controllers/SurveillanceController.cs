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

    private bool CanUpload() => User.IsInRole("Admin") || User.IsInRole("Encoder");

    [HttpPost("upload")]
    public async Task<IActionResult> Upload(IFormFile? file, [FromServices] UploadTools t)
    {
        if (!CanUpload()) return Forbid();
        if (file is null || file.Length == 0) return BadRequest(ApiResponse.Fail("BAD_REQUEST", "file required"));
        using var r = new StreamReader(file.OpenReadStream());
        try { return Ok(ApiResponse.Ok(await t.IngestAsync(await r.ReadToEndAsync(), file.FileName, User.Identity?.Name))); }
        catch (InvalidDataException ex) { return BadRequest(ApiResponse.Fail("BAD_REQUEST", ex.Message)); }
    }

    [HttpGet("batches")]
    public async Task<IActionResult> Batches([FromServices] UploadTools t) =>
        Ok(ApiResponse.Ok(await t.BatchesAsync()));

    [HttpGet("batches/{id}/issues")]
    public async Task<IActionResult> Issues(long id, [FromServices] UploadTools t) =>
        Ok(ApiResponse.Ok(await t.IssuesAsync(id)));

    [HttpPost("issues/{id}/resolve")]
    public async Task<IActionResult> ResolveIssue(long id, [FromBody] ResolveReq req, [FromServices] UploadTools t)
    {
        if (!CanUpload()) return Forbid();
        var accept = string.Equals(req.Action, "accept", StringComparison.OrdinalIgnoreCase);
        return Ok(ApiResponse.Ok(await t.ResolveAsync(id, accept)));
    }

    [HttpGet("template")]
    public IActionResult Template() => Content(UploadTools.TemplateCsv(), "text/csv");
}

public record ResolveReq(string Action);
