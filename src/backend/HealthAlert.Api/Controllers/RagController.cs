using HealthAlert.Common;
using HealthAlert.Tools;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HealthAlert.Api.Controllers;

public record RagAskReq(string? Q);

[ApiController, Route("api/rag"), Authorize]
public class RagController(RagGetTools g, RagEditTools e, IConfiguration cfg, IHostEnvironment env) : ControllerBase
{
    [HttpPost("ask")]
    public async Task<IActionResult> Ask([FromBody] RagAskReq r) =>
        Ok(ApiResponse.Ok(await g.AskAsync(r.Q)));

    [AllowAnonymous, HttpPost("reindex")] // ponytail: cron-key auth, not JWT — automation has no session
    public async Task<IActionResult> Reindex([FromHeader(Name = CronAuth.Header)] string? k)
    {
        var exp = CronAuth.Expected(cfg, env.IsDevelopment());
        if (exp is null) return StatusCode(500, ApiResponse.Fail("CONFIG", "Cron:Key missing"));
        if (k != exp) return Unauthorized();
        return Ok(ApiResponse.Ok(await e.ReindexAsync()));
    }
}
