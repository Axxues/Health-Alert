using HealthAlert.Api.Controllers;
using HealthAlert.Database;
using HealthAlert.Tools;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HealthAlert.Tests;

public class ApiEnvelopeTest
{
    [Fact]
    public async Task Rag_returns_citation()
    {
        var ctx = TestDb.Create();
        var c = new RagController(new RagTools(ctx));
        var r = await c.Ask(new RagAskReq("dengue fluids?"));
        var ok = Assert.IsType<OkObjectResult>(r);
        var j = System.Text.Json.JsonSerializer.Serialize(ok.Value);
        Assert.Contains("page", j, StringComparison.OrdinalIgnoreCase);
    }
}
