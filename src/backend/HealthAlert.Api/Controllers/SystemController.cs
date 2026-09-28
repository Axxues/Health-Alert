using HealthAlert.Common;
using Microsoft.AspNetCore.Mvc;

namespace HealthAlert.Api.Controllers;

[ApiController, Route("api/system")]
public class SystemController : ControllerBase
{
    [HttpGet("status")]
    public IActionResult Status() => Ok(ApiResponse.Ok(new { ok = true, version = "mvp" }));
}
