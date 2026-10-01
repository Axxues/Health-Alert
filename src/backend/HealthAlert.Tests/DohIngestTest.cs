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

    private sealed class FakeCsvHandler(string csv) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken ct) =>
            Task.FromResult(new HttpResponseMessage(System.Net.HttpStatusCode.OK)
            {
                Content = new StringContent(csv)
            });
    }
}
