using HealthAlert.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HealthAlert.Api.Controllers;

[ApiController, Route("api/reports"), Authorize]
public class ReportsController : ControllerBase
{
    [HttpGet("surveillance")]
    public IActionResult Surveillance() => Ok(ApiResponse.Ok(new
    {
        week = "2026-W39", dengue = 42, leptospirosis = 7, ili = 130, asthma = 25,
    }));
}
