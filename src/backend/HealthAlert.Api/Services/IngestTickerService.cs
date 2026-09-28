namespace HealthAlert.Api.Services;

// ponytail: single hourly loop covers hourly/daily/weekly cadences; split timers if ops needs exact cron
public class IngestTickerService(ILogger<IngestTickerService> log) : BackgroundService
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
            await Task.Delay(TimeSpan.FromHours(1), ct);
        }
    }
}
