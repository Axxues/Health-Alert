using HealthAlert.Common;
using HealthAlert.Tools;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HealthAlert.Api.Controllers;

[ApiController, Route("api/riskmaps"), Authorize]
public class RiskMapsController(RiskMapsGetTools t) : ControllerBase
{
    // ponytail: computed hotspots; vwHotspots view if queries grow
    [HttpGet("hotspots")]
    public async Task<IActionResult> Hotspots() => Ok(ApiResponse.Ok(await t.Hotspots()));
}
