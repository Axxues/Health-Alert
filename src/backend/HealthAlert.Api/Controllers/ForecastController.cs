using HealthAlert.Common;
using HealthAlert.Tools;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HealthAlert.Api.Controllers;

public record ForecastReq(string? Disease, string? Muni);

[ApiController, Route("api/forecast"), Authorize]
public class ForecastController : ControllerBase
{
    [HttpGet("outlook")]
    public async Task<IActionResult> Outlook([FromQuery] string? disease, [FromQuery] string? muni,
        [FromServices] ForecastGetTools g) =>
        Ok(ApiResponse.Ok(await g.OutlookAsync(disease, muni)));

    [HttpPost("run")]
    public async Task<IActionResult> Run([FromBody] ForecastReq r,
        [FromServices] ForecastEditTools e) =>
        Ok(ApiResponse.Ok(await e.RunAsync(r.Disease, r.Muni)));
}
