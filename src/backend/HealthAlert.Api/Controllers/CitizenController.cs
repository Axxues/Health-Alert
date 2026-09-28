using HealthAlert.Common;
using HealthAlert.Tools;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HealthAlert.Api.Controllers;

public record CitizenAskReq(string? Q);

[ApiController, Route("api/citizen"), AllowAnonymous]
public class CitizenController(CitizenGetTools t) : ControllerBase
{
    // ponytail: Taglish stub; real triage model if clinicians ask
    [HttpPost("ask")]
    public IActionResult Ask([FromBody] CitizenAskReq r) =>
        Ok(ApiResponse.Ok(t.Ask(r.Q)));
}
