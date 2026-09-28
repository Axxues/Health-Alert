using HealthAlert.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HealthAlert.Api.Controllers;

public record SendReq(string? To, string? Message);

[ApiController, Route("api/messaging"), Authorize]
public class MessagingController : ControllerBase
{
    [HttpPost("send")]
    public IActionResult Send([FromBody] SendReq r) =>
        Ok(ApiResponse.Ok(new { to = r.To, status = "queued" }));
}
