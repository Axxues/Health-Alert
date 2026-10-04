using Microsoft.EntityFrameworkCore;

namespace HealthAlert.Database;

// ponytail: single file for all entities + context + seed; split per-domain if file grows
public class TblDisease { public long Id { get; set; } public string? Code { get; set; } public string? Category { get; set; } }
public class TblFeed { public long Id { get; set; } public string? Code { get; set; } public string? Name { get; set; } }
public class TblCase { public long Id { get; set; } public long? DiseaseId { get; set; } public long? FeedId { get; set; } public string? SourceKey { get; set; } public double? Count { get; set; } public DateTime? ReportedAt { get; set; } }
public class TblForecastRun { public long Id { get; set; } public long? DiseaseId { get; set; } public string? Muni { get; set; } public double? Probability { get; set; } public string? Band { get; set; } public string? Drivers { get; set; } }
public class TblAlert { public long Id { get; set; } public long? DiseaseId { get; set; } public string? Message { get; set; } public string? Status { get; set; } public string? Kind { get; set; } public string? Muni { get; set; } public string? Disease { get; set; } public string? PlaybookCode { get; set; } }
public class TblPlaybook { public long Id { get; set; } public string? Code { get; set; } public string? Title { get; set; } }
public class TblPlaybookExecution { public long Id { get; set; } public long? PlaybookId { get; set; } public string? Status { get; set; } public string? Log { get; set; } }
public class TblRagDoc { public long Id { get; set; } public string? Doc { get; set; } public string? Chapter { get; set; } public string? Page { get; set; } public string? Content { get; set; } public string? Source { get; set; } } // ponytail: Source gates answers to DOH/WHO guidelines only
public class TblUser { public long Id { get; set; } public string? Username { get; set; } public string? Role { get; set; } public bool IsActive { get; set; } = true; }
public class TblAuditTrail { public long Id { get; set; } public string? Action { get; set; } public DateTime? CreatedAt { get; set; } }
public class TblOutbox { public long Id { get; set; } public string? IdempotencyKey { get; set; } public string? Payload { get; set; } }
public class TblCovariateReading { public long Id { get; set; } public string? Place { get; set; } public DateTime? Date { get; set; } public string? Source { get; set; } public string? Payload { get; set; } }
public class TblForecastModel { public long Id { get; set; } public string? Disease { get; set; } public int Version { get; set; } public string? CoeffsJson { get; set; } public DateTime? TrainedFrom { get; set; } public DateTime? TrainedTo { get; set; } public double? Rmse { get; set; } public double? Mae { get; set; } public double? R2 { get; set; } public string? Status { get; set; } public double? BaselineRmse { get; set; } public double? BaselineMae { get; set; } public string? BaselineName { get; set; } }
public class TblRiskThreshold { public long Id { get; set; } public string? Disease { get; set; } public double HighProb { get; set; } public double WatchProb { get; set; } public double VelocityHigh { get; set; } public double VelocityWatch { get; set; } public string? CovariateKey { get; set; } public double CovariateHigh { get; set; } public string? Method { get; set; } public string? Citation { get; set; } }
public class TblUploadBatch { public long Id { get; set; } public string? FileName { get; set; } public string? UploadedBy { get; set; } public DateTime? UploadedAt { get; set; } public string? Status { get; set; } public int Accepted { get; set; } public int Quarantined { get; set; } public int Duplicates { get; set; } }
public class TblUploadIssue { public long Id { get; set; } public long BatchId { get; set; } public int Row { get; set; } public string? Reason { get; set; } public string? RawLine { get; set; } public string? SourceKey { get; set; } public string? Disease { get; set; } public double? Count { get; set; } public DateTime? ReportedAt { get; set; } public bool Resolved { get; set; } public string? Resolution { get; set; } }

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
    public DbSet<TblCovariateReading> CovariateReadings => Set<TblCovariateReading>();
    public DbSet<TblForecastModel> ForecastModels => Set<TblForecastModel>();
    public DbSet<TblRiskThreshold> RiskThresholds => Set<TblRiskThreshold>();
    public DbSet<TblUploadBatch> UploadBatches => Set<TblUploadBatch>();
    public DbSet<TblUploadIssue> UploadIssues => Set<TblUploadIssue>();

    protected override void OnModelCreating(ModelBuilder m)
    {
        m.Entity<TblDisease>().ToTable("tblDiseases");
        m.Entity<TblFeed>().ToTable("tblFeeds");
        m.Entity<TblCase>().ToTable("tblCases");
        m.Entity<TblCase>().HasIndex(c => c.SourceKey).IsUnique(); // ponytail: DB guard for ingest idempotency under concurrency
        m.Entity<TblForecastRun>().ToTable("tblForecastRuns");
        m.Entity<TblAlert>().ToTable("tblAlerts");
        m.Entity<TblPlaybook>().ToTable("tblPlaybooks");
        m.Entity<TblPlaybookExecution>().ToTable("tblPlaybookExecutions");
        m.Entity<TblRagDoc>().ToTable("tblRagDocs");
        m.Entity<TblUser>().ToTable("tblUsers");
        m.Entity<TblAuditTrail>().ToTable("tblAuditTrail");
        m.Entity<TblOutbox>().ToTable("tblOutbox");
        m.Entity<TblCovariateReading>().ToTable("tblCovariateReadings");
        m.Entity<TblForecastModel>().ToTable("tblForecastModels");
        m.Entity<TblRiskThreshold>().ToTable("tblRiskThresholds");
        m.Entity<TblUploadBatch>().ToTable("tblUploadBatches");
        m.Entity<TblUploadIssue>().ToTable("tblUploadIssues");
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
        if (!await c.RagDocs.AnyAsync())
        {
            // ponytail: curated DOH/WHO action-guideline excerpts for the 4 tracked diseases; re-seed (not append) when guidance changes
            c.RagDocs.AddRange(
                new TblRagDoc { Source = "DOH", Doc = "DOH Clinical Practice Guidelines on Dengue", Chapter = "Warning Signs and Triage", Page = "CPG Dengue", Content = "Refer dengue patients with warning signs (abdominal pain, persistent vomiting, fluid accumulation, mucosal bleeding, lethargy, liver enlargement, rising hematocrit with falling platelets) to a facility with inpatient capacity the same day. Start oral rehydration early for Group A outpatients." },
                new TblRagDoc { Source = "WHO", Doc = "WHO Dengue Guidelines for Diagnosis, Treatment, Prevention and Control", Chapter = "Vector Control", Page = "Ch.4", Content = "Apply targeted larval control (temephos/Bti) to non-removable water containers and destroy disposable breeding sites within 100m of index households; repeat entomological survey after 7 days." },
                new TblRagDoc { Source = "DOH", Doc = "DOH Leptospirosis Prevention and Control Guidelines", Chapter = "Chemoprophylaxis", Page = "Lepto CPG", Content = "Give doxycycline 200mg single dose as chemoprophylaxis to high-risk flood-exposed individuals per DOH protocol; treat suspected leptospirosis early and do not wait for confirmatory serology." },
                new TblRagDoc { Source = "WHO", Doc = "WHO Human Leptospirosis Guidance for Diagnosis, Surveillance and Control", Chapter = "Outbreak Response", Page = "Ch.6", Content = "After flooding, conduct active case finding for acute febrile illness with myalgia or conjunctival suffusion, ensure safe water, and clear drainage and refuse that shelter rodents." },
                new TblRagDoc { Source = "DOH", Doc = "DOH PIDSR Manual (RA 11332)", Chapter = "Category I Reporting", Page = "PIDSR Ch.3", Content = "Report Category I notifiable diseases (including dengue and leptospirosis) through EDCS-IS within 24 hours of detection; weekly morbidity reports consolidate facility data every Monday." },
                new TblRagDoc { Source = "WHO", Doc = "WHO ILI/SARI Surveillance Guidance", Chapter = "Case Definitions", Page = "ILI", Content = "Define influenza-like illness as acute respiratory infection with measured fever >=38C and cough with onset within 10 days; sample sentinel ILI cases for virologic confirmation." },
                new TblRagDoc { Source = "DOH", Doc = "DOH Asthma Clinical Practice Guidelines", Chapter = "Acute Exacerbation", Page = "Asthma CPG", Content = "Treat acute asthma exacerbation with repeated inhaled short-acting beta-agonists, add ipratropium for severe attacks, and give systemic corticosteroids early; step up controller therapy at follow-up." },
                new TblRagDoc { Source = "WHO", Doc = "WHO Air Quality Guidelines", Chapter = "Particulate Matter", Page = "AQG 2021", Content = "Keep PM2.5 exposure below WHO guideline levels; advise sensitive groups including asthmatics to limit outdoor exertion when AQI exceeds 100." });
        }
        if (!await c.CovariateReadings.AnyAsync())
        {
            // ponytail: offline fallback so models and pages work before the first feed pull
            c.CovariateReadings.Add(new TblCovariateReading { Place = "San Fernando City", Date = new DateTime(2026, 9, 27), Source = "seed-fallback", Payload = "{\"rainMm\":112.5,\"tempC\":31.4,\"aqi\":42,\"pageviews\":180}" });
        }
        // ponytail: inlined threshold literals (Database can't ref Tools; Tools -> Database)
        foreach (var code in new[] { "dengue", "leptospirosis", "ili", "asthma" })
        {
            if (!await c.RiskThresholds.AnyAsync(t => t.Disease == code))
            {
                c.RiskThresholds.Add(code switch
                {
                    "leptospirosis" => new TblRiskThreshold { Disease = code, HighProb = 0.84, WatchProb = 0.63, VelocityHigh = 1.4, VelocityWatch = 1.15, CovariateKey = "rainMm", CovariateHigh = 150, Method = "endemic-channel+2SD excl-max-year; EARS-C1 k=3; Serfling k=1.64; MEM 40/90/97.5; prob=logistic(z); velocity grid-selected", Citation = "WHO TDR dengue surveillance handbook (2016); Hutwagner et al., MMWR 2003 (EARS); WHO EWARS dengue (2017)" },
                    "ili" => new TblRiskThreshold { Disease = code, HighProb = 0.84, WatchProb = 0.63, VelocityHigh = 1.4, VelocityWatch = 1.15, CovariateKey = "pageviews", CovariateHigh = 800, Method = "endemic-channel+2SD excl-max-year; EARS-C1 k=3; Serfling k=1.64; MEM 40/90/97.5; prob=logistic(z); velocity grid-selected", Citation = "Serfling, Am J Public Health 1963; CDC ILINet; Vega et al. MEM (WHO method)" },
                    "asthma" => new TblRiskThreshold { Disease = code, HighProb = 0.84, WatchProb = 0.63, VelocityHigh = 1.4, VelocityWatch = 1.15, CovariateKey = "aqi", CovariateHigh = 100, Method = "endemic-channel+2SD excl-max-year; EARS-C1 k=3; Serfling k=1.64; MEM 40/90/97.5; prob=logistic(z); velocity grid-selected", Citation = "WHO EWARS alarm-indicator logic (2017); WHO Air Quality Guidelines 2021; CDC flu severity classification" },
                    _ => new TblRiskThreshold { Disease = code, HighProb = 0.84, WatchProb = 0.63, VelocityHigh = 1.4, VelocityWatch = 1.15, CovariateKey = "breteau", CovariateHigh = 20, Method = "endemic-channel+2SD excl-max-year; EARS-C1 k=3; Serfling k=1.64; MEM 40/90/97.5; prob=logistic(z); velocity grid-selected", Citation = "WHO TDR dengue surveillance handbook (2016); Brady et al., PLoS NTD 2013; WHO EWARS dengue (2017)" },
                });
            }
        }
        await c.SaveChangesAsync();
    }
}
