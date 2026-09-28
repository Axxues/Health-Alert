using HealthAlert.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HealthAlert.Api.Controllers;

[ApiController, Route("api/system"), Authorize]
public class SystemController : ControllerBase
{
    [HttpGet("status")]
    public IActionResult Status() => Ok(ApiResponse.Ok(new { ok = true, version = "mvp" }));
}
