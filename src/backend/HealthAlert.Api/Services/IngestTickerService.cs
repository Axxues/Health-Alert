using HealthAlert.Tools;

namespace HealthAlert.Api.Services;

// ponytail: single hourly loop covers hourly/daily/weekly cadences; split timers if ops needs exact cron
public class IngestTickerService(ILogger<IngestTickerService> log, IServiceProvider services) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        var tick = 0;
        while (!ct.IsCancellationRequested)
        {
            tick++;
            // hourly: weather/heatmap/aqi/news(edge 5min logs only) | daily: trends/social/esu | weekly: pidsr/covid/rag
            log.LogInformation("ingest tick {Tick}: hourly feeds + {Daily}daily + {Weekly}weekly",
                tick, tick % 24 == 0 ? "" : "skip-", tick % 168 == 0 ? "" : "skip-");
            if (tick % 24 == 0)
            {
                try
                {
                    using var scope = services.CreateScope();
                    await scope.ServiceProvider.GetRequiredService<CovariateFeedService>().RefreshDailyAsync(ct);
                }
                catch (Exception ex) { log.LogWarning(ex, "covariate refresh failed; last good readings stand"); }
            }
            await Task.Delay(TimeSpan.FromHours(1), ct);
        }
    }
}
