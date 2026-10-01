using HealthAlert.Common;
using HealthAlert.Tools;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HealthAlert.Api.Controllers;

public record ForecastReq(string? Disease, string? Muni);

[ApiController, Route("api/forecast"), Authorize]
public class ForecastController(IConfiguration cfg, IHostEnvironment env) : ControllerBase
{
    [HttpGet("outlook")]
    public async Task<IActionResult> Outlook([FromQuery] string? disease, [FromQuery] string? muni,
        [FromServices] ForecastGetTools g) =>
        Ok(ApiResponse.Ok(await g.OutlookAsync(disease, muni)));

    [HttpGet("locations")]
    public async Task<IActionResult> Locations([FromQuery] string? search, [FromQuery] string? province,
        [FromQuery] string? municipality, [FromQuery] string? disease, [FromQuery] string? riskLevel,
        [FromServices] RiskMapsGetTools g) =>
        Ok(ApiResponse.Ok(await g.LocationsAsync(search, province, municipality, disease, riskLevel)));

    [HttpPost("train")]
    public async Task<IActionResult> Train([FromBody] ForecastReq r,
        [FromServices] ModelRegistryTools reg) =>
        Ok(ApiResponse.Ok(await reg.TrainAsync(r.Disease ?? "dengue")));

    [HttpPost("promote/{id:long}")]
    public async Task<IActionResult> Promote(long id,
        [FromServices] ModelRegistryTools reg)
    {
        await reg.PromoteAsync(id);
        return Ok(ApiResponse.Ok(new { promoted = id }));
    }

    [AllowAnonymous, HttpPost("run")]
    public async Task<IActionResult> Run([FromBody] ForecastReq r,
        [FromServices] ForecastEditTools e, [FromHeader(Name = CronAuth.Header)] string? k)
    {
        var exp = CronAuth.Expected(cfg, env.IsDevelopment());
        if (User.Identity?.IsAuthenticated != true && k != exp && !env.IsDevelopment())
            return Unauthorized();
        return Ok(ApiResponse.Ok(await e.RunAsync(r.Disease, r.Muni)));
    }
}
