using HealthAlert.Database;

namespace HealthAlert.Tools;

public static class RiskBandTools
{
    public static TblRiskThreshold DefaultFor(string disease) => disease switch
    {
        "leptospirosis" => new() { Disease = disease, HighProb = 0.7, WatchProb = 0.4, VelocityHigh = 1.4, VelocityWatch = 1.15, CovariateKey = "rainMm", CovariateHigh = 150 },
        "ili" => new() { Disease = disease, HighProb = 0.7, WatchProb = 0.4, VelocityHigh = 1.4, VelocityWatch = 1.15, CovariateKey = "pageviews", CovariateHigh = 800 },
        "asthma" => new() { Disease = disease, HighProb = 0.7, WatchProb = 0.4, VelocityHigh = 1.4, VelocityWatch = 1.15, CovariateKey = "aqi", CovariateHigh = 100 },
        _ => new() { Disease = disease, HighProb = 0.7, WatchProb = 0.4, VelocityHigh = 1.4, VelocityWatch = 1.15, CovariateKey = "breteau", CovariateHigh = 20 },
    };

    public static string Assign(double prob, double velocity, double covariate, TblRiskThreshold t)
    {
        if (prob >= t.HighProb || velocity >= t.VelocityHigh || covariate >= t.CovariateHigh) return "high";
        if (prob >= t.WatchProb || velocity >= t.VelocityWatch) return "moderate";
        return "low";
    }
}
