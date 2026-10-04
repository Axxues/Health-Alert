namespace HealthAlert.Tools.ML;

public static class RidgeRegression
{
    public static double[] Fit(double[][] X, double[] y, double lambda)
    {
        int n = X.Length, p = X[0].Length;
        var a = new double[p, p];
        var b = new double[p];
        for (int i = 0; i < n; i++)
            for (int j = 0; j < p; j++)
            {
                b[j] += X[i][j] * y[i];
                for (int k = 0; k < p; k++) a[j, k] += X[i][j] * X[i][k];
            }
        for (int j = 1; j < p; j++) a[j, j] += lambda; // bias unpenalized
        return Solve(a, b, p);
    }

    public static (double Rmse, double Mae, double R2) WalkForward(double[][] X, double[] y, double lambda, int folds = 3)
    {
        var preds = new List<double>(); var actual = new List<double>();
        int cut = X.Length / (folds + 1);
        for (int f = 1; f <= folds; f++)
        {
            var w = Fit(X[..(cut * f)], y[..(cut * f)], lambda);
            for (int i = cut * f; i < Math.Min(cut * (f + 1), X.Length); i++)
            {
                preds.Add(Dot(w, X[i])); actual.Add(y[i]);
            }
        }
        return Metrics(preds, actual);
    }

    /// <summary>Naive baselines over the SAME walk-forward prediction points as <see cref="WalkForward"/>
    /// (identical cut/fold loop) so the comparison is fair. Persistence predicts the last observed value;
    /// seasonal-naive-52 predicts the value 52 weeks ago, falling back to persistence when fewer than
    /// 53 points of history are available at the prediction point.</summary>
    public static (double Rmse, double Mae, double R2) BaselineMetrics(double[] y, int folds = 3, int season = 52, bool seasonal = false)
    {
        var preds = new List<double>(); var actual = new List<double>();
        int cut = y.Length / (folds + 1);
        for (int f = 1; f <= folds; f++)
        {
            for (int i = cut * f; i < Math.Min(cut * (f + 1), y.Length); i++)
            {
                // ponytail: seasonal falls back to persistence when history is shorter than 53 weeks
                preds.Add(seasonal && i >= season ? y[i - season] : y[i - 1]);
                actual.Add(y[i]);
            }
        }
        return Metrics(preds, actual);
    }

    private static (double Rmse, double Mae, double R2) Metrics(List<double> preds, List<double> actual)
    {
        double mae = preds.Zip(actual, (p, a) => Math.Abs(p - a)).Average();
        double rmse = Math.Sqrt(preds.Zip(actual, (p, a) => (p - a) * (p - a)).Average());
        double mean = actual.Average();
        double r2 = 1 - preds.Zip(actual, (p, a) => (p - a) * (p - a)).Sum() / actual.Sum(a => (a - mean) * (a - mean));
        return (rmse, mae, r2);
    }

    private static double Dot(double[] w, double[] x) => w.Zip(x, (a, b) => a * b).Sum();

    private static double[] Solve(double[,] a, double[] b, int p)
    {
        var m = (double[,])a.Clone(); var v = (double[])b.Clone();
        for (int c = 0; c < p; c++)
        {
            int piv = c;
            for (int r = c + 1; r < p; r++) if (Math.Abs(m[r, c]) > Math.Abs(m[piv, c])) piv = r;
            for (int k = 0; k < p; k++) (m[c, k], m[piv, k]) = (m[piv, k], m[c, k]);
            (v[c], v[piv]) = (v[piv], v[c]);
            for (int r = c + 1; r < p; r++)
            {
                double f = m[r, c] / m[c, c];
                for (int k = c; k < p; k++) m[r, k] -= f * m[c, k];
                v[r] -= f * v[c];
            }
        }
        var x = new double[p];
        for (int r = p - 1; r >= 0; r--)
        {
            double s = v[r];
            for (int k = r + 1; k < p; k++) s -= m[r, k] * x[k];
            x[r] = s / m[r, r];
        }
        return x;
    }
}
