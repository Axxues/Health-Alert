using Microsoft.AspNetCore.Mvc;

namespace HealthAlert.Api.Controllers;

public record LoginReq(string? Username, string? Password);

[ApiController, Route("api/auth")]
public class AuthController : ControllerBase
{
    // ponytail: stub token; full JWT Identity if roles grow
    [HttpPost("login")]
    public IActionResult Login([FromBody] LoginReq r) =>
        Ok(new Common.ApiResponse<object>(true, "OK", "",
            new { token = "stub", role = "MHO", permissions = new[] { "surveillance:forecast:view" } }));
}
