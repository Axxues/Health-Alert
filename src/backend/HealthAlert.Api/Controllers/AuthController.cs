using System.Security.Claims;
using System.Text;
using HealthAlert.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;

namespace HealthAlert.Api.Controllers;

public record LoginReq(string? Username, string? Password);

[ApiController, Route("api/auth"), Authorize]
public class AuthController(IConfiguration cfg, IHostEnvironment env) : ControllerBase
{
    // ponytail: stub role/perms but real signed JWT; full Identity if roles grow
    [AllowAnonymous, HttpPost("login")]
    public IActionResult Login([FromBody] LoginReq r)
    {
        var key = CronAuth.JwtKey(cfg, env.IsDevelopment());
        var role = "MHO";
        var perms = new[] { Permissions.ForecastView };
        var claims = new List<Claim> { new(ClaimTypes.Name, r.Username ?? "mho"), new(ClaimTypes.Role, role) };
        claims.AddRange(perms.Select(p => new Claim("perm", p)));
        var handler = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler();
        var token = handler.WriteToken(handler.CreateToken(new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddHours(8),
            SigningCredentials = new SigningCredentials(
                new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)), SecurityAlgorithms.HmacSha256),
        }));
        return Ok(new Common.ApiResponse<object>(true, "OK", "",
            new { token, role, permissions = perms }));
    }
}
