using HealthAlert.Common;
using HealthAlert.Tools;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HealthAlert.Api.Controllers;

[ApiController, Route("api/playbooks"), Authorize]
public class PlaybookController(PlaybookTools t) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List() => Ok(ApiResponse.Ok(await t.ListAsync()));

    [HttpPost("{id}/execute")]
    public async Task<IActionResult> Execute(long id) => Ok(ApiResponse.Ok(await t.ExecuteAsync(id)));
}
