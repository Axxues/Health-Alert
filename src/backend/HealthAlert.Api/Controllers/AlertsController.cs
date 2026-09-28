using HealthAlert.Common;
using HealthAlert.Tools;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HealthAlert.Api.Controllers;

[ApiController, Route("api/alerts"), Authorize]
public class AlertsController(AlertsGetTools g, AlertsEditTools e) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List() => Ok(ApiResponse.Ok(await g.ListAsync()));

    [HttpPost("{id}/ack")]
    public async Task<IActionResult> Ack(long id) =>
        await e.AckAsync(id) is { } a ? Ok(ApiResponse.Ok(a)) : NotFound();
}
