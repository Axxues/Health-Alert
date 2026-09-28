using HealthAlert.Common;
using HealthAlert.Tools;
using Microsoft.AspNetCore.Mvc;

namespace HealthAlert.Api.Controllers;

public record RagAskReq(string? Q);

[ApiController, Route("api/rag")]
public class RagController(RagTools t) : ControllerBase
{
    [HttpPost("ask")]
    public async Task<IActionResult> Ask([FromBody] RagAskReq r) =>
        Ok(ApiResponse.Ok(await t.AskAsync(r.Q)));

    [HttpPost("reindex")]
    public async Task<IActionResult> Reindex([FromHeader(Name = "X-Cron-Key")] string? k)
    {
        if (k != "dev-cron-key") return Unauthorized();
        return Ok(ApiResponse.Ok(await t.ReindexAsync()));
    }
}
