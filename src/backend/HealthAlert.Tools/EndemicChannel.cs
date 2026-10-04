namespace HealthAlert.Tools;

public static class EndemicChannel
{
    /// <summary>Endemic-channel upper limit: mean + 2 SD over a 5-year baseline excluding the epidemic (max) year. Source: WHO TDR Technical handbook for dengue surveillance, outbreak prediction/detection and response (2016); Brady et al., PLoS NTD 2013; outlier-year exclusion per Umaña et al., JMIR Public Health Surveill 2026.</summary>
    public static double EndemicValue(IReadOnlyList<double> history)
    {
        var (mean, sd) = MeanSdExcludingMax(history);
        return mean + 2 * sd;
    }

    /// <summary>Baseline mean and sample SD after dropping the single max (epidemic) year when history has 3+ points. Source: WHO TDR dengue surveillance handbook (2016); Umaña et al., JMIR Public Health Surveill 2026.</summary>
    public static (double Mean, double Sd) MeanSdExcludingMax(IReadOnlyList<double> history)
    {
        var list = history.ToList();
        if (list.Count >= 3) list.Remove(list.Max());
        if (list.Count == 0) return (0, 0);
        var mean = list.Average();
        if (list.Count < 2) return (mean, 0);
        var sd = Math.Sqrt(list.Sum(v => (v - mean) * (v - mean)) / (list.Count - 1));
        return (mean, sd);
    }

    /// <summary>Two-successive-weeks confirmation: true only when the last two weeks both exceed the channel. Source: WHO TDR dengue surveillance handbook (2016); Serfling, Am J Public Health 1963 (2 successive weeks above threshold).</summary>
    public static bool ConfirmFlag(params bool[] weeksAbove) =>
        weeksAbove.Length >= 2 && weeksAbove[^1] && weeksAbove[^2];

    /// <summary>EARS C1 trigger: current week exceeds baseline mean + k SD (k = 3). Source: Hutwagner et al., MMWR 2003.</summary>
    public static bool EarsC1(IReadOnlyList<double> baseline, double current, double k = 3.0)
    {
        var mean = baseline.Average();
        var sd = baseline.Count < 2 ? 0 : Math.Sqrt(baseline.Sum(v => (v - mean) * (v - mean)) / (baseline.Count - 1));
        return current > mean + k * sd;
    }

    /// <summary>Serfling epidemic threshold: baseline mean + 1.64 SD. Source: Serfling, Am J Public Health 1963; CDC ILINet baseline (non-epidemic-week mean + 2 SD) uses the same construction.</summary>
    public static double SerflingThreshold(IReadOnlyList<double> baseline, double k = 1.64)
    {
        var mean = baseline.Average();
        var sd = baseline.Count < 2 ? 0 : Math.Sqrt(baseline.Sum(v => (v - mean) * (v - mean)) / (baseline.Count - 1));
        return mean + k * sd;
    }

    /// <summary>MEM intensity bands: upper limits of the 40/90/97.5% CIs (z = 0.524/1.645/2.24) mapping to medium/high/very-high. Source: Vega et al. MEM (WHO method); CDC flu severity classification.</summary>
    public static (double Medium, double High, double VeryHigh) MemBands(IReadOnlyList<double> baseline)
    {
        var mean = baseline.Average();
        var sd = baseline.Count < 2 ? 0 : Math.Sqrt(baseline.Sum(v => (v - mean) * (v - mean)) / (baseline.Count - 1));
        return (mean + 0.524 * sd, mean + 1.645 * sd, mean + 2.24 * sd);
    }

    /// <summary>Endemic-channel z-score of the current count against a baseline mean/SD. Source: WHO TDR dengue surveillance handbook (2016).</summary>
    public static double ZScore(double current, double mean, double sd) =>
        sd <= 0 ? 0 : (current - mean) / sd;

    /// <summary>Outbreak probability as the logistic of the endemic-channel z-score. Source: WHO EWARS Operational Guide for Dengue Outbreaks (2017) alarm-indicator logic.</summary>
    public static double Probability(double current, double mean, double sd) =>
        1 / (1 + Math.Exp(-ZScore(current, mean, sd)));
}
