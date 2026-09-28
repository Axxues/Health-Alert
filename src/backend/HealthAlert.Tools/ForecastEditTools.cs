using HealthAlert.Database;
using Microsoft.EntityFrameworkCore;

namespace HealthAlert.Tools;

public class ForecastEditTools(HealthAlertDbContext ctx)
{
    public async Task<ForecastOutlook> RunAsync(string? disease, string? muni)
    {
        var o = ForecastGetTools.Build(disease) with { Muni = muni };
        var code = string.IsNullOrWhiteSpace(disease) ? "dengue" : disease.Trim().ToLowerInvariant();
        var d = await ctx.Diseases.FirstOrDefaultAsync(x => x.Code == code);
        await ctx.ForecastRuns.AddAsync(new TblForecastRun { DiseaseId = d?.Id, Muni = muni, Probability = o.Probability, Band = o.Band, Drivers = string.Join(",", o.Drivers) });
        await ctx.SaveChangesAsync();
        return o;
    }
}
