using HealthAlert.Common;
using HealthAlert.Tools;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HealthAlert.Api.Controllers;

[ApiController, Route("api/reports"), Authorize]
public class ReportsController(ReportsGetTools t) : ControllerBase
{
    [HttpGet("surveillance")]
    public IActionResult Surveillance() => Ok(ApiResponse.Ok(t.Surveillance()));
}
