using HealthAlert.Common;
using HealthAlert.Tools;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HealthAlert.Api.Controllers;

[ApiController, Route("api/system"), Authorize]
public class SystemController(SystemGetTools t) : ControllerBase
{
    [HttpGet("status")]
    public IActionResult Status() => Ok(ApiResponse.Ok(t.Status()));
}
