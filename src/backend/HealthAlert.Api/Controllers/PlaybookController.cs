using HealthAlert.Common;
using HealthAlert.Tools;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HealthAlert.Api.Controllers;

[ApiController, Route("api/playbooks"), Authorize]
public class PlaybookController(PlaybookGetTools g, PlaybookEditTools e) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List() => Ok(ApiResponse.Ok(await g.ListAsync()));

    [HttpPost("{id}/execute")]
    public async Task<IActionResult> Execute(long id) => Ok(ApiResponse.Ok(await e.ExecuteAsync(id)));
}
