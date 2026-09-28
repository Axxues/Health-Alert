using HealthAlert.Common;
using HealthAlert.Tools;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HealthAlert.Api.Controllers;

[ApiController, Route("api/users"), Authorize]
public class SystemUserController(SystemUserGetTools g, SystemUserEditTools e) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List()
    {
        await e.EnsureSeededAsync();
        return Ok(ApiResponse.Ok(await g.ListAsync()));
    }
}
