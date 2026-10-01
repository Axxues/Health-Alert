using HealthAlert.Database;
using HealthAlert.Tools;
using Microsoft.EntityFrameworkCore;

namespace HealthAlert.Tests;

public class DohIngestTest
{
    private const string FixtureCsv =
        "loc,cases,deaths,date,Region\n" +
        "#adm2+name,#affected+infected,#affected+killed,#date,#region\n" +
        "ALBAY,15,0,1/10/2016,REGION V-BICOL REGION\n" +
        "ALBAY,13,0,1/17/2016,REGION V-BICOL REGION\n" +
        "CEBU,20,1,1/10/2016,REGION VII-CENTRAL VISAYAS";

    [Fact]
    public void ParseHdxCsv_skips_hxl_row_and_parses_values()
    {
        var rows = DohIngestTools.ParseHdxCsv(FixtureCsv);
        Assert.Equal(3, rows.Count);
        Assert.Equal("ALBAY", rows[0].Province);
        Assert.Equal("REGION V-BICOL REGION", rows[0].Region);
        Assert.Equal(new DateTime(2016, 1, 4), rows[0].Week);
        Assert.Equal(15, rows[0].Cases);
        Assert.Equal(new DateTime(2016, 1, 11), rows[1].Week);
        Assert.Equal("CEBU", rows[2].Province);
        Assert.Equal(20, rows[2].Cases);
    }

    [Fact]
    public async Task BackfillHdx_writes_rows_then_zero_on_rerun()
    {
        var ctx = TestDb.Create();
        await Seed.RunAsync(ctx);
        var http = new HttpClient(new FakeCsvHandler(FixtureCsv));
        var first = await DohIngestTools.BackfillHdxAsync(ctx, http, CancellationToken.None);
        Assert.Equal(3, first);
        Assert.Equal(3, await ctx.Cases.CountAsync(c => c.SourceKey!.Contains("|HDX-")));
        var feedCodes = await ctx.Cases.Join(ctx.Feeds, c => c.FeedId, f => f.Id, (c, f) => f.Code).Distinct().ToListAsync();
        Assert.Contains("hdx-doh-epi", feedCodes);
        var second = await DohIngestTools.BackfillHdxAsync(ctx, new HttpClient(new FakeCsvHandler(FixtureCsv)), CancellationToken.None);
        Assert.Equal(0, second);
        Assert.Equal(3, await ctx.Cases.CountAsync(c => c.SourceKey!.Contains("|HDX-")));
    }

    private const string FixtureHtml =
        "<html><body>" +
        "<a href=\"/health-statistics/surveillance-week38\">WDSR Week 38 report</a>" +
        "<a href=\"https://doh.gov.ph/weekly-update-38\">Weekly update</a>" +
        "<a href=\"/about/contact\">Contact</a>" +
        "<table><tr><th>Province</th><th>Dengue</th></tr>" +
        "<tr><td>CEBU</td><td>12</td></tr>" +
        "<tr><td>ALBAY</td><td>7</td></tr></table>" +
        "</body></html>";

    [Fact]
    public void ParseWdsrListings_extracts_surveillance_links()
    {
        var findings = DohIngestTools.ParseWdsrListings(FixtureHtml, "https://doh.gov.ph/health-statistics/weekly-disease-surveillance-report");
        Assert.Equal(2, findings.Count);
        Assert.Equal("https://doh.gov.ph/health-statistics/surveillance-week38", findings[0].Url);
        Assert.Equal("https://doh.gov.ph/weekly-update-38", findings[1].Url);
    }

    [Fact]
    public async Task ScrapeWdsr_returns_findings_and_ingests_table_rows()
    {
        var ctx = TestDb.Create();
        await Seed.RunAsync(ctx);
        var http = new HttpClient(new FakeHtmlHandler(FixtureHtml));
        var findings = await DohIngestTools.ScrapeWdsrAsync(http, CancellationToken.None);
        Assert.Equal(2, findings.Count);
        var rows = DohIngestTools.ParseWdsrTables(FixtureHtml);
        Assert.Equal(2, rows.Count);
        Assert.Equal("CEBU", rows[0].Province);
        Assert.Equal("dengue", rows[0].Disease);
        Assert.Equal(12, rows[0].Cases);
        var written = await DohIngestTools.IngestWdsrTablesAsync(ctx, FixtureHtml, CancellationToken.None);
        Assert.Equal(2, written);
        Assert.Equal(2, await ctx.Cases.CountAsync(c => c.SourceKey!.Contains("|WDSR-")));
        var again = await DohIngestTools.IngestWdsrTablesAsync(ctx, FixtureHtml, CancellationToken.None);
        Assert.Equal(0, again);
    }

    private sealed class FakeCsvHandler(string csv) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken ct) =>
            Task.FromResult(new HttpResponseMessage(System.Net.HttpStatusCode.OK)
            {
                Content = new StringContent(csv)
            });
    }

    private sealed class FakeHtmlHandler(string html) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken ct) =>
            Task.FromResult(new HttpResponseMessage(System.Net.HttpStatusCode.OK)
            {
                Content = new StringContent(html)
            });
    }
}
