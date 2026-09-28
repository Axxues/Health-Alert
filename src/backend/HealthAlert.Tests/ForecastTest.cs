using HealthAlert.Tools;

namespace HealthAlert.Tests;

public class ForecastTest
{
    [Fact] public void Dengue_declares_when_gt_mean_plus_sd() { Assert.True(new DengueForecaster().IsOutbreak(new double[] { 10, 12, 11, 40 })); }
    [Fact] public void Lepto_heavy_rain_RR_2_45() { Assert.Equal(2.45, new DlnmForecaster().Rr("heavy"), 1); }
    [Fact] public void Asthma_fires_same_day_only() { Assert.True(new HiAqiForecaster().AsthmaAlert(120, 0)); Assert.False(new HiAqiForecaster().AsthmaAlert(120, 2)); }
    [Fact] public void Hi_danger_band() { Assert.Equal("Danger", new HiAqiForecaster().Band(103, 60)); } // 103F+60% -> HI~130F -> Danger
}
