using System.Security.Claims;
using HealthAlert.Api.Controllers;
using HealthAlert.Database;
using HealthAlert.Tools;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HealthAlert.Tests;

public class UploadPipelineTest
{
    private const string Header = "morbidity_week,morbidity_year,province,municipality,barangay,facility_name,facility_type,disease_code,cases_this_week,deaths_this_week,age_under5,age_5plus,male,female,prepared_by,contact,date_submitted";

    private static string Row(int week, int year, string muni, string facility, string disease, int cases, int deaths, string barangay = "Poblacion") =>
        $"{week},{year},La Union,{muni},{barangay},{facility},RHU,{disease},{cases},{deaths},1,1,1,1,Nurse,0917,2026-10-01";

    [Fact]
    public async Task Valid_csv_accepts_all_incl_zero_report()
    {
        var ctx = TestDb.Create();
        await Seed.RunAsync(ctx);
        var t = new UploadTools(ctx);
        var csv = string.Join("\n", Header,
            Row(39, 2026, "Agoo", "Agoo RHU", "dengue", 5, 0),
            Row(39, 2026, "Bauang", "Bauang RHU", "ili", 0, 0),
            Row(39, 2026, "Naguilian", "Naguilian RHU", "asthma", 2, 0));
        var r = await t.IngestAsync(csv, "weekly.csv", "encoder1");
        Assert.Equal(3, r.Accepted);
        Assert.Equal(0, r.Quarantined);
        Assert.Equal(0, r.Duplicates);
        Assert.Equal(3, await ctx.Cases.CountAsync(c => c.SourceKey != null && c.SourceKey.Contains("2026-W39")));
    }

    [Fact]
    public async Task Bad_csv_counts_accepted_quarantined_duplicates()
    {
        var ctx = TestDb.Create();
        await Seed.RunAsync(ctx);
        var t = new UploadTools(ctx);
        var futureYear = DateTime.UtcNow.Year + 1;
        var csv = string.Join("\n", Header,
            Row(39, 2026, "Agoo", "Agoo RHU", "dengue", 5, 0),
            Row(39, 2026, "Agoo", "Agoo RHU", "covid", 3, 0),
            Row(10, futureYear, "Bauang", "Bauang RHU", "ili", 2, 0),
            Row(39, 2026, "Naguilian", "Naguilian RHU", "dengue", 1, 5),
            Row(39, 2026, "Agoo", "Agoo RHU", "dengue", 5, 0));
        var r = await t.IngestAsync(csv, "bad.csv", "encoder1");
        Assert.Equal(1, r.Accepted);
        Assert.Equal(3, r.Quarantined);
        Assert.Equal(1, r.Duplicates);
        var issues = await ctx.UploadIssues.Where(i => i.BatchId == r.BatchId).ToListAsync();
        Assert.Equal(3, issues.Count);
        Assert.Contains(issues, i => i.Reason == "unknown-disease");
        Assert.Contains(issues, i => i.Reason == "future-week");
        Assert.Contains(issues, i => i.Reason == "deaths-exceed-cases");
    }

    [Fact]
    public async Task Resolve_accept_writes_case()
    {
        var ctx = TestDb.Create();
        await Seed.RunAsync(ctx);
        var t = new UploadTools(ctx);
        var csv = string.Join("\n", Header,
            Row(39, 2026, "Agoo", "Agoo RHU", "covid", 3, 0));
        var r = await t.IngestAsync(csv, "q.csv", "encoder1");
        Assert.Equal(0, r.Accepted);
        var issue = await ctx.UploadIssues.FirstAsync(i => i.BatchId == r.BatchId);
        var before = await ctx.Cases.CountAsync();
        var c = await t.ResolveAsync(issue.Id, accept: true);
        Assert.NotNull(c);
        Assert.Equal(before + 1, await ctx.Cases.CountAsync());
        Assert.True((await ctx.UploadIssues.FindAsync(issue.Id))!.Resolved);
    }

    [Fact]
    public async Task Upload_endpoint_forbids_viewer()
    {
        var ctx = TestDb.Create();
        var c = new SurveillanceController(TestCfg.Config(), TestCfg.Env());
        var viewer = new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.Role, "Viewer")], "test"));
        c.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext { User = viewer } };
        var r = await c.Upload(null, new UploadTools(ctx));
        Assert.IsType<ForbidResult>(r);
    }

    [Fact]
    public async Task Barangay_column_writes_five_part_key()
    {
        var ctx = TestDb.Create();
        await Seed.RunAsync(ctx);
        var t = new UploadTools(ctx);
        var csv = string.Join("\n", Header,
            Row(39, 2026, "Agoo", "Agoo RHU", "dengue", 5, 0, barangay: "Lucao"));
        var r = await t.IngestAsync(csv, "brgy.csv", "encoder1");
        Assert.Equal(1, r.Accepted);
        Assert.Equal("Agoo|Lucao|Agoo RHU|2026-W39|dengue",
            await ctx.Cases.Where(c => c.SourceKey != null).Select(c => c.SourceKey!).FirstAsync());
    }

    [Fact]
    public async Task Empty_barangay_keeps_legacy_four_part_key()
    {
        var ctx = TestDb.Create();
        await Seed.RunAsync(ctx);
        var t = new UploadTools(ctx);
        var csv = string.Join("\n", Header,
            Row(39, 2026, "Agoo", "Agoo RHU", "dengue", 5, 0, barangay: ""));
        var r = await t.IngestAsync(csv, "legacy.csv", "encoder1");
        Assert.Equal(1, r.Accepted);
        Assert.Equal("Agoo|Agoo RHU|2026-W39|dengue",
            await ctx.Cases.Where(c => c.SourceKey != null).Select(c => c.SourceKey!).FirstAsync());
    }
}
