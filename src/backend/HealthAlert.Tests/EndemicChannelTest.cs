using HealthAlert.Tools;

namespace HealthAlert.Tests;

public class EndemicChannelTest
{
    [Fact]
    public void EndemicValue_excludes_epidemic_year()
    {
        // [10,12,11,13] (max year 50 excluded): mean 11.5, sample SD ~1.291 -> ~14.08
        Assert.Equal(14.08, EndemicChannel.EndemicValue([10, 12, 11, 13, 50]), precision: 1);
    }

    [Fact]
    public void ConfirmFlag_needs_two_successive_weeks()
    {
        Assert.True(EndemicChannel.ConfirmFlag([true, true]));
        Assert.False(EndemicChannel.ConfirmFlag([true]));
        Assert.False(EndemicChannel.ConfirmFlag([true, false]));
    }

    [Fact]
    public void EarsC1_triggers_only_beyond_3sd()
    {
        double[] baseline = [10, 11, 10, 12, 11, 10, 11]; // mean+3SD ~12.98
        Assert.False(EndemicChannel.EarsC1(baseline, 11.0));
        Assert.True(EndemicChannel.EarsC1(baseline, 14.0));
    }

    [Fact]
    public void SerflingThreshold_is_mean_plus_1_64_sd()
    {
        double[] baseline = [8, 9, 10, 9, 8, 10, 9, 11, 10, 9]; // mean 9.3, SD ~0.949 -> ~10.86
        Assert.Equal(10.86, EndemicChannel.SerflingThreshold(baseline), precision: 1);
    }

    [Fact]
    public void MemBands_order_medium_high_veryHigh()
    {
        double[] baseline = [8, 9, 10, 9, 8, 10, 9, 11, 10, 9];
        var (medium, high, veryHigh) = EndemicChannel.MemBands(baseline);
        Assert.Equal(9.80, medium, precision: 1);
        Assert.Equal(10.86, high, precision: 1);
        Assert.Equal(11.43, veryHigh, precision: 1);
        Assert.True(medium < high && high < veryHigh);
    }

    [Fact]
    public void Probability_is_logistic_of_zscore()
    {
        Assert.Equal(0.5, EndemicChannel.Probability(10.0, 10.0, 2.0), precision: 3);
        Assert.Equal(0.881, EndemicChannel.Probability(14.0, 10.0, 2.0), precision: 3);
        Assert.Equal(0.5, EndemicChannel.Probability(10.0, 10.0, 0.0), precision: 3);
    }
}
