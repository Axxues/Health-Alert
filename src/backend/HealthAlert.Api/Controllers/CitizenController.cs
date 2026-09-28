using HealthAlert.Common;
using Microsoft.AspNetCore.Mvc;

namespace HealthAlert.Api.Controllers;

public record CitizenAskReq(string? Q);

[ApiController, Route("api/citizen")]
public class CitizenController : ControllerBase
{
    // ponytail: Taglish stub; real triage model if clinicians ask
    [HttpPost("ask")]
    public IActionResult Ask([FromBody] CitizenAskReq r) =>
        Ok(ApiResponse.Ok(new { reply = $"Kumusta! Para sa '{r.Q}': magpahinga, uminom ng fluids, at pumunta sa RHU kung may lagnat >2 araw." }));
}
