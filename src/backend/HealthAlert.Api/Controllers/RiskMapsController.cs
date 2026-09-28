using HealthAlert.Common;
using Microsoft.AspNetCore.Mvc;

namespace HealthAlert.Api.Controllers;

[ApiController, Route("api/riskmaps")]
public class RiskMapsController : ControllerBase
{
    // ponytail: seeded hotspots; vwHotspots view if queries grow
    [HttpGet("hotspots")]
    public IActionResult Hotspots() => Ok(ApiResponse.Ok(new[]
    {
        new { muni = "San Roque", disease = "dengue", level = "high", lat = 14.6, lng = 121.0 },
        new { muni = "Sta. Cruz", disease = "leptospirosis", level = "medium", lat = 14.5, lng = 121.1 },
    }));
}
