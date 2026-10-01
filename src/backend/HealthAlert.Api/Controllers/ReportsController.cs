using HealthAlert.Common;
using HealthAlert.Tools;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HealthAlert.Api.Controllers;

[ApiController, Route("api/reports"), Authorize]
public class ReportsController(ReportsGetTools t) : ControllerBase
{
    [HttpGet("surveillance")]
    public IActionResult Surveillance() => Ok(ApiResponse.Ok(t.Surveillance()));

    [HttpGet("bulletin")]
    public async Task<IActionResult> Bulletin([FromQuery] string? week)
    {
        if (!DateTime.TryParse(week, out var w)) w = RecentMonday();
        else w = MondayOf(w);
        return Ok(ApiResponse.Ok(await t.BulletinAsync(w)));
    }

    [HttpGet("export")]
    public async Task<IActionResult> Export([FromQuery] string? muni, [FromQuery] string? disease, [FromQuery] string? from, [FromQuery] string? to)
    {
        if (!DateTime.TryParse(from, out var f)) f = DateTime.MinValue;
        if (!DateTime.TryParse(to, out var e)) e = DateTime.MaxValue;
        if (string.IsNullOrWhiteSpace(muni) || muni == "all") muni = null;
        if (string.IsNullOrWhiteSpace(disease) || disease == "all") disease = null;
        return Ok(ApiResponse.Ok(await t.ExportAsync(muni, disease, f, e)));
    }

    private static DateTime MondayOf(DateTime d)
    {
        var diff = ((int)d.DayOfWeek - (int)DayOfWeek.Monday + 7) % 7;
        return d.Date.AddDays(-diff);
    }

    private static DateTime RecentMonday() => MondayOf(DateTime.Today);
}
