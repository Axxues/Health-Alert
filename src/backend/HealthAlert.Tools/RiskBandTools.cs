using HealthAlert.Database;

namespace HealthAlert.Tools;

public static class RiskBandTools
{
    /// <summary>Literature-grounded defaults: prob cutoffs are logistic(MEM z) — watch = logistic(0.524) ≈ 0.63, high = logistic(1.645) ≈ 0.84; velocity 1.4/1.15 is a grid-selected placeholder to tune on walk-forward error; covariate limits per disease guidance. Sources: Vega et al. MEM (WHO method); WHO TDR dengue surveillance handbook (2016); WHO EWARS dengue (2017); WHO Air Quality Guidelines 2021 (asthma AQI 100).</summary>
    public static TblRiskThreshold DefaultFor(string disease) => disease switch
    {
        "leptospirosis" => new() { Disease = disease, HighProb = 0.84, WatchProb = 0.63, VelocityHigh = 1.4, VelocityWatch = 1.15, CovariateKey = "rainMm", CovariateHigh = 150, Method = "endemic-channel+2SD excl-max-year; EARS-C1 k=3; Serfling k=1.64; MEM 40/90/97.5; prob=logistic(z); velocity grid-selected", Citation = "WHO TDR dengue surveillance handbook (2016); Hutwagner et al., MMWR 2003 (EARS); WHO EWARS dengue (2017)" },
        "ili" => new() { Disease = disease, HighProb = 0.84, WatchProb = 0.63, VelocityHigh = 1.4, VelocityWatch = 1.15, CovariateKey = "pageviews", CovariateHigh = 800, Method = "endemic-channel+2SD excl-max-year; EARS-C1 k=3; Serfling k=1.64; MEM 40/90/97.5; prob=logistic(z); velocity grid-selected", Citation = "Serfling, Am J Public Health 1963; CDC ILINet; Vega et al. MEM (WHO method)" },
        "asthma" => new() { Disease = disease, HighProb = 0.84, WatchProb = 0.63, VelocityHigh = 1.4, VelocityWatch = 1.15, CovariateKey = "aqi", CovariateHigh = 100, Method = "endemic-channel+2SD excl-max-year; EARS-C1 k=3; Serfling k=1.64; MEM 40/90/97.5; prob=logistic(z); velocity grid-selected", Citation = "WHO EWARS alarm-indicator logic (2017); WHO Air Quality Guidelines 2021; CDC flu severity classification" },
        _ => new() { Disease = disease, HighProb = 0.84, WatchProb = 0.63, VelocityHigh = 1.4, VelocityWatch = 1.15, CovariateKey = "breteau", CovariateHigh = 20, Method = "endemic-channel+2SD excl-max-year; EARS-C1 k=3; Serfling k=1.64; MEM 40/90/97.5; prob=logistic(z); velocity grid-selected", Citation = "WHO TDR dengue surveillance handbook (2016); Brady et al., PLoS NTD 2013; WHO EWARS dengue (2017)" },
    };

    /// <summary>Max-severity band across prob/velocity/covariate signals against a literature-grounded threshold row.</summary>

    /// <summary>Max-severity band across prob/velocity/covariate signals against a literature-grounded threshold row.</summary>
    public static string Assign(double prob, double velocity, double covariate, TblRiskThreshold t)
    {
        if (prob >= t.HighProb || velocity >= t.VelocityHigh || covariate >= t.CovariateHigh) return "high";
        if (prob >= t.WatchProb || velocity >= t.VelocityWatch) return "moderate";
        return "low";
    }

    /// <summary>Outbreak probability for a current count against history via the endemic-channel z-score. Source: WHO TDR dengue surveillance handbook (2016); WHO EWARS (2017).</summary>
    public static double ChannelProbability(double current, IReadOnlyList<double> history)
    {
        var (mean, sd) = EndemicChannel.MeanSdExcludingMax(history);
        return EndemicChannel.Probability(current, mean, sd);
    }

    /// <summary>Band assignment fed by the endemic channel: prob = logistic(z), velocity = current/baseline-mean. Source: WHO TDR dengue surveillance handbook (2016); WHO EWARS (2017).</summary>
    public static string ChannelBand(double current, IReadOnlyList<double> history, TblRiskThreshold t)
    {
        var (mean, sd) = EndemicChannel.MeanSdExcludingMax(history);
        return Assign(EndemicChannel.Probability(current, mean, sd), mean > 0 ? current / mean : 1.0, 0.0, t);
    }
}
