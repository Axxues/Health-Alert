using Microsoft.EntityFrameworkCore;

namespace HealthAlert.Database;

// ponytail: single file for all entities + context + seed; split per-domain if file grows
public class TblDisease { public long Id { get; set; } public string? Code { get; set; } public string? Category { get; set; } }
public class TblFeed { public long Id { get; set; } public string? Code { get; set; } public string? Name { get; set; } }
public class TblCase { public long Id { get; set; } public long? DiseaseId { get; set; } public long? FeedId { get; set; } public string? SourceKey { get; set; } public double? Count { get; set; } public DateTime? ReportedAt { get; set; } }
public class TblForecastRun { public long Id { get; set; } public long? DiseaseId { get; set; } public double? Probability { get; set; } public string? Band { get; set; } public string? Drivers { get; set; } }
public class TblAlert { public long Id { get; set; } public long? DiseaseId { get; set; } public string? Message { get; set; } public string? Status { get; set; } }
public class TblPlaybook { public long Id { get; set; } public string? Code { get; set; } public string? Title { get; set; } }
public class TblPlaybookExecution { public long Id { get; set; } public long? PlaybookId { get; set; } public string? Status { get; set; } public string? Log { get; set; } }
public class TblRagDoc { public long Id { get; set; } public string? Doc { get; set; } public string? Chapter { get; set; } public string? Page { get; set; } public string? Content { get; set; } }
public class TblUser { public long Id { get; set; } public string? Username { get; set; } public string? Role { get; set; } }
public class TblAuditTrail { public long Id { get; set; } public string? Action { get; set; } public DateTime? CreatedAt { get; set; } }
public class TblOutbox { public long Id { get; set; } public string? IdempotencyKey { get; set; } public string? Payload { get; set; } }

public class HealthAlertDbContext(DbContextOptions<HealthAlertDbContext> o) : DbContext(o)
{
    public DbSet<TblDisease> Diseases => Set<TblDisease>();
    public DbSet<TblFeed> Feeds => Set<TblFeed>();
    public DbSet<TblCase> Cases => Set<TblCase>();
    public DbSet<TblForecastRun> ForecastRuns => Set<TblForecastRun>();
    public DbSet<TblAlert> Alerts => Set<TblAlert>();
    public DbSet<TblPlaybook> Playbooks => Set<TblPlaybook>();
    public DbSet<TblPlaybookExecution> PlaybookExecutions => Set<TblPlaybookExecution>();
    public DbSet<TblRagDoc> RagDocs => Set<TblRagDoc>();
    public DbSet<TblUser> Users => Set<TblUser>();
    public DbSet<TblAuditTrail> AuditTrail => Set<TblAuditTrail>();
    public DbSet<TblOutbox> Outbox => Set<TblOutbox>();

    protected override void OnModelCreating(ModelBuilder m)
    {
        m.Entity<TblDisease>().ToTable("tblDiseases");
        m.Entity<TblFeed>().ToTable("tblFeeds");
        m.Entity<TblCase>().ToTable("tblCases");
        m.Entity<TblForecastRun>().ToTable("tblForecastRuns");
        m.Entity<TblAlert>().ToTable("tblAlerts");
        m.Entity<TblPlaybook>().ToTable("tblPlaybooks");
        m.Entity<TblPlaybookExecution>().ToTable("tblPlaybookExecutions");
        m.Entity<TblRagDoc>().ToTable("tblRagDocs");
        m.Entity<TblUser>().ToTable("tblUsers");
        m.Entity<TblAuditTrail>().ToTable("tblAuditTrail");
        m.Entity<TblOutbox>().ToTable("tblOutbox");
    }
}

public static class Seed
{
    public static async Task RunAsync(HealthAlertDbContext c)
    {
        if (!await c.Diseases.AnyAsync())
        {
            c.Diseases.AddRange(
                new TblDisease { Code = "dengue", Category = "vector" },
                new TblDisease { Code = "leptospirosis", Category = "waterborne" },
                new TblDisease { Code = "ili", Category = "respiratory" },
                new TblDisease { Code = "asthma", Category = "environmental" });
        }
        if (!await c.Feeds.AnyAsync())
        {
            for (int i = 1; i <= 10; i++) c.Feeds.Add(new TblFeed { Code = $"feed-{i}", Name = $"feed-{i}" });
        }
        await c.SaveChangesAsync();
    }
}
