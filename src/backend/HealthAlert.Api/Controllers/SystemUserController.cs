using HealthAlert.Common;
using HealthAlert.Database;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HealthAlert.Api.Controllers;

[ApiController, Route("api/users")]
public class SystemUserController(HealthAlertDbContext ctx) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List()
    {
        if (!await ctx.Users.AnyAsync())
        {
            ctx.Users.Add(new TblUser { Username = "mho", Role = "MHO" });
            await ctx.SaveChangesAsync();
        }
        return Ok(ApiResponse.Ok(await ctx.Users.OrderBy(u => u.Id).ToListAsync()));
    }
}
