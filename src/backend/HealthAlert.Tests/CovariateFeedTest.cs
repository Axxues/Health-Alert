using System.Net;
using System.Text;
using HealthAlert.Database;
using HealthAlert.Tools;
using Microsoft.EntityFrameworkCore;

namespace HealthAlert.Tests;

file sealed class FakeRainHandler : HttpMessageHandler
{
    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage req, CancellationToken ct) =>
        Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent("{\"daily\":{\"precipitation_sum\":[9.5],\"temperature_2m_max\":[30.5]}}", Encoding.UTF8, "application/json")
        });
}

file sealed class ThrowHandler : HttpMessageHandler
{
    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage req, CancellationToken ct) =>
        throw new HttpRequestException("network down");
}

public class CovariateFeedTest
{
    [Fact]
    public async Task Refresh_upserts_same_day_twice_as_one_row()
    {
        var ctx = TestDb.Create();
        var svc = new CovariateFeedService(ctx, new HttpClient(new FakeRainHandler()));
        await svc.RefreshDailyAsync(CancellationToken.None);
        await svc.RefreshDailyAsync(CancellationToken.None);
        Assert.Equal(CovariateFeedService.Places.Count, await ctx.CovariateReadings.CountAsync(c => c.Source == "open-meteo"));
    }

    [Fact]
    public async Task Failed_pull_keeps_last_good_reading()
    {
        var ctx = TestDb.Create();
        ctx.CovariateReadings.Add(new TblCovariateReading { Place = "Agoo", Date = DateTime.UtcNow.Date, Source = "open-meteo", Payload = "{}" });
        await ctx.SaveChangesAsync();
        var svc = new CovariateFeedService(ctx, new HttpClient(new ThrowHandler()));
        await svc.RefreshDailyAsync(CancellationToken.None);
        Assert.Equal(1, await ctx.CovariateReadings.CountAsync());
    }
}
