using HealthAlert.Common;
using HealthAlert.Tools;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HealthAlert.Api.Controllers;

[ApiController, Route("api/users"), Authorize]
public class SystemUserController(SystemUserGetTools g, SystemUserEditTools e) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List()
    {
        if (!User.IsInRole("Admin")) return Forbid();
        await e.EnsureSeededAsync();
        return Ok(ApiResponse.Ok(await g.ListAsync()));
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateUserReq req)
    {
        if (!User.IsInRole("Admin")) return Forbid();
        return Ok(ApiResponse.Ok(await e.CreateAsync(req.Username, req.Role)));
    }

    [HttpPost("{id}/active")]
    public async Task<IActionResult> SetActive(long id, ActiveReq req)
    {
        if (!User.IsInRole("Admin")) return Forbid();
        return await e.SetActiveAsync(id, req.Active) is { } u ? Ok(ApiResponse.Ok(u)) : NotFound();
    }

    [HttpPost("{id}/role")]
    public async Task<IActionResult> SetRole(long id, RoleReq req)
    {
        if (!User.IsInRole("Admin")) return Forbid();
        return await e.SetRoleAsync(id, req.Role) is { } u ? Ok(ApiResponse.Ok(u)) : NotFound();
    }
}

public record CreateUserReq(string Username, string Role);
public record ActiveReq(bool Active);
public record RoleReq(string Role);
