using HealthAlert.Common;
using HealthAlert.Tools;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HealthAlert.Api.Controllers;

public record SendReq(string? To, string? Message);

[ApiController, Route("api/messaging"), Authorize]
public class MessagingController(MessagingGetTools t) : ControllerBase
{
    [HttpPost("send")]
    public IActionResult Send([FromBody] SendReq r) =>
        Ok(ApiResponse.Ok(t.Send(r.To, r.Message)));
}
