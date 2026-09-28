using HealthAlert.Common;
using HealthAlert.Tools;
using Microsoft.AspNetCore.Mvc;

namespace HealthAlert.Api.Controllers;

[ApiController, Route("api/alerts")]
public class AlertsController(AlertsTools t) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List() => Ok(ApiResponse.Ok(await t.ListAsync()));

    [HttpPost("{id}/ack")]
    public async Task<IActionResult> Ack(long id) =>
        await t.AckAsync(id) is { } a ? Ok(ApiResponse.Ok(a)) : NotFound();
}
