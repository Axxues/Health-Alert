using HealthAlert.Database;
using HealthAlert.Tools;
using Microsoft.EntityFrameworkCore;

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
                try
                {
                    using var scope = services.CreateScope();
                    var maps = scope.ServiceProvider.GetRequiredService<RiskMapsGetTools>();
                    var spots = await maps.Hotspots();
                    var ctx = scope.ServiceProvider.GetRequiredService<HealthAlert.Database.HealthAlertDbContext>();
                    await new AlertEngineTools(ctx).EvaluateAsync(spots.Select(s => (s.Muni, s.Disease, s.Level)).ToList());
                }
                catch (Exception ex) { log.LogWarning(ex, "alert evaluation failed; existing alerts stand"); }
            }
            if (tick % 168 == 0)
            {
                try
                {
                    using var scope = services.CreateScope();
                    var ctx = scope.ServiceProvider.GetRequiredService<HealthAlertDbContext>();
                    if (!await ctx.Cases.AnyAsync(c => c.SourceKey != null && c.SourceKey.Contains("|HDX-"), ct))
                    {
                        var http = scope.ServiceProvider.GetRequiredService<IHttpClientFactory>().CreateClient();
                        var n = await DohIngestTools.BackfillHdxAsync(ctx, http, ct);
                        log.LogInformation("HDX backfill wrote {Rows} rows", n);
                    }
                }
                catch (Exception ex) { log.LogWarning(ex, "HDX backfill failed; existing cases stand"); }
                try
                {
                    using var scope = services.CreateScope();
                    var ctx = scope.ServiceProvider.GetRequiredService<HealthAlertDbContext>();
                    var http = scope.ServiceProvider.GetRequiredService<IHttpClientFactory>().CreateClient();
                    var html = await http.GetStringAsync(DohIngestTools.WdsrUrl, ct);
                    var n = await DohIngestTools.IngestWdsrTablesAsync(ctx, html, ct);
                    log.LogInformation("WDSR scrape wrote {Rows} rows", n);
                }
                catch (Exception ex) { log.LogWarning(ex, "WDSR scrape failed; existing cases stand"); }
            }
            await Task.Delay(TimeSpan.FromHours(1), ct);
        }
    }
}
