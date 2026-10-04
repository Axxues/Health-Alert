using HealthAlert.Tools;
using HealthAlert.Tools.ML;

namespace HealthAlert.Tests;

public class RidgeRegressionTest
{
    [Fact]
    public void Fit_recovers_linear_weights()
    {
        var X = new[] { new[] { 1.0, 1.0 }, new[] { 1.0, 2.0 }, new[] { 1.0, 3.0 }, new[] { 1.0, 4.0 } };
        var y = new[] { 3.0, 5.0, 7.0, 9.0 };
        var w = RidgeRegression.Fit(X, y, 1e-6);
        Assert.Equal(1.0, w[0], precision: 3);
        Assert.Equal(2.0, w[1], precision: 3);
    }

    [Fact]
    public void WalkForward_reports_finite_metrics()
    {
        var X = Enumerable.Range(1, 12).Select(i => new[] { 1.0, (double)i }).ToArray();
        var y = X.Select(r => 2 * r[1] + 1).ToArray();
        var (rmse, mae, r2) = RidgeRegression.WalkForward(X, y, 0.1);
        Assert.True(double.IsFinite(rmse) && double.IsFinite(mae) && double.IsFinite(r2));
        Assert.True(r2 > 0.9);
    }
}
