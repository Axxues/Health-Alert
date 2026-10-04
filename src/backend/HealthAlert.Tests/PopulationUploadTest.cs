using HealthAlert.Database;
using HealthAlert.Tools;
using HealthAlert.Tools.ML;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace HealthAlert.Tests;

public class PopulationUploadTest
{
    private const string Header = "province,municipality,barangay,population,reference_year,source";

    [Fact]
    public async Task Valid_csv_imports_and_reupload_is_idempotent()
    {
        var ctx = TestDb.Create();
        var t = new PopulationTools(ctx);
        var csv = string.Join("\n", Header,
            "La Union,Agoo,Poblacion,5000,2024,census",
            "La Union,Agoo,San Nicolas,3000,2024,cbms",
            "La Union,Bauang,Poblacion,4000,2024,rhu-record");
        var (valid, errors) = PopulationTools.ParseValidateCsv(csv);
        Assert.Empty(errors);
        Assert.Equal(3, valid.Count);
        var r1 = await t.ImportAsync(valid, "encoder1");
        Assert.Equal(3, r1.Accepted);
        Assert.Equal(3, await ctx.PlacePopulations.CountAsync());
        var r2 = await t.ImportAsync(valid, "encoder1");
        Assert.Equal(3, r2.Accepted);
        Assert.Equal(3, await ctx.PlacePopulations.CountAsync());
    }

    [Fact]
    public async Task Bad_csv_reports_errors_and_writes_nothing()
    {
        foreach (var csv in new[]
        {
            string.Join("\n", Header, "La Union,Agoo,Poblacion,-5,2024,census"),
            string.Join("\n", Header, "La Union,Agoo,Poblacion,100,1999,census"),
            string.Join("\n", "prov,muni,brgy,pop,year,src", "La Union,Agoo,Poblacion,100,2024,census"),
            string.Join("\n", Header, "La Union,Agoo,Poblacion,100,2024,guess"),
        })
        {
            var ctx = TestDb.Create();
            var t = new PopulationTools(ctx);
            var (valid, errors) = PopulationTools.ParseValidateCsv(csv);
            Assert.NotEmpty(errors);
            Assert.Empty(valid);
            await t.ImportAsync(valid, "encoder1");
            Assert.Equal(0, await ctx.PlacePopulations.CountAsync());
        }
    }

    [Fact]
    public async Task Lookup_returns_newest_first_and_locations_carry_latest_year()
    {
        var ctx = TestDb.Create();
        var t = new PopulationTools(ctx);
        var csv = string.Join("\n", Header,
            "La Union,Agoo,Poblacion,5000,2023,census",
            "La Union,Agoo,Poblacion,6000,2024,census",
            "La Union,Agoo,San Nicolas,2000,2024,other");
        var (valid, _) = PopulationTools.ParseValidateCsv(csv);
        await t.ImportAsync(valid, "encoder1");
        var rows = await t.QueryAsync("La Union", "Agoo", null);
        Assert.Equal(3, rows.Count);
        Assert.Equal(2024, rows[0].RefYear);
        Assert.Equal(2024, rows[1].RefYear);
        Assert.Equal(2023, rows[2].RefYear);

        var maps = new RiskMapsGetTools(ctx, new ModelRegistryTools(ctx), new MemoryCache(new MemoryCacheOptions()));
        var loc = (await maps.LocationsAsync(null, null, "Agoo", null, null)).First(r => r.Municipality == "Agoo");
        Assert.Equal(2024, loc.PopulationYear);
        Assert.Equal(8000, loc.PopulationAtRisk);

        var empty = TestDb.Create();
        var emptyMaps = new RiskMapsGetTools(empty, new ModelRegistryTools(empty), new MemoryCache(new MemoryCacheOptions()));
        var noPop = (await emptyMaps.LocationsAsync(null, null, "Agoo", null, null)).First(r => r.Municipality == "Agoo");
        Assert.Null(noPop.PopulationAtRisk);
        Assert.Null(noPop.PopulationYear);
    }
}
