using HealthAlert.Common;
using HealthAlert.Tools;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HealthAlert.Api.Controllers;

[ApiController, Route("api/riskmaps"), Authorize]
public class RiskMapsController(RiskMapsGetTools t) : ControllerBase
{
    // ponytail: seeded hotspots; vwHotspots view if queries grow
    [HttpGet("hotspots")]
    public IActionResult Hotspots() => Ok(ApiResponse.Ok(t.Hotspots()));
}
