using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using HealthAlert.Database;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace HealthAlert.Tests;

// ponytail: one factory for all HTTP smoke; per-test InMemory DB keeps tests isolated
public class SmokeFactory : WebApplicationFactory<Program>
{
    // ponytail: shared root — factory setup registers options twice; without this, scopes see different stores
    private static readonly InMemoryDatabaseRoot _root = new();

    protected override void ConfigureWebHost(IWebHostBuilder b) =>
        b.ConfigureAppConfiguration(c => c.AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Jwt:Key"] = "test-jwt-key-32chars-minimum-0123456789",
            ["Cron:Key"] = "test-cron-key",
        }))
        .ConfigureServices(s =>
        {
            // ponytail: drop all EF registrations (SqlServer provider singletons conflict with InMemory)
            foreach (var d in s.Where(x => x.ServiceType.Namespace?.StartsWith("Microsoft.EntityFrameworkCore") == true).ToList())
                s.Remove(d);
            s.AddDbContext<HealthAlertDbContext>(o => o.UseInMemoryDatabase("smoke", _root));
        });
}

public class HttpSmokeTest
{
    private static async Task<string> LoginAsync(HttpClient c)
    {
        var r = await c.PostAsJsonAsync("/api/auth/login", new { username = "mho", password = "x" });
        r.EnsureSuccessStatusCode();
        var data = JsonDocument.Parse(await r.Content.ReadAsStringAsync()).RootElement.GetProperty("data");
        Assert.Equal("dashboard:view", data.GetProperty("permissions")[0].GetString());
        return data.GetProperty("token").GetString()!;
    }

    private static void Bearer(HttpClient c, string token) =>
        c.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

    [Fact]
    public async Task Login_grants_every_guarded_slice()
    {
        using var f = new SmokeFactory();
        var c = f.CreateClient();
        var r = await c.PostAsJsonAsync("/api/auth/login", new { username = "mho", password = "x" });
        r.EnsureSuccessStatusCode();
        var perms = JsonDocument.Parse(await r.Content.ReadAsStringAsync()).RootElement
            .GetProperty("data").GetProperty("permissions").EnumerateArray()
            .Select(x => x.GetString()).ToHashSet();
        foreach (var p in new[] { "dashboard:view", "surveillance:forecast:view", "surveillance:feeds:view",
            "riskmaps:hotspots:view", "rag:answer:view", "playbook:list:view", "alerts:list:view", "citizen:ask:view" })
            Assert.Contains(p, perms);
    }

    [Fact]
    public async Task Login_ingest_outlook_returns_probability_and_drivers()
    {
        using var f = new SmokeFactory();
        var c = f.CreateClient();
        var token = await LoginAsync(c);

        using var ing = new HttpRequestMessage(HttpMethod.Post, "/api/surveillance/ingest/pidsr");
        ing.Headers.Add("X-Cron-Key", "test-cron-key");
        ing.Content = JsonContent.Create(new { sourceKey = "smoke-1", disease = "dengue", count = 42 });
        Assert.Equal(HttpStatusCode.OK, (await c.SendAsync(ing)).StatusCode);

        Bearer(c, token);
        var or = await c.GetAsync("/api/forecast/outlook?disease=dengue&muni=San%20Roque");
        or.EnsureSuccessStatusCode();
        var o = JsonDocument.Parse(await or.Content.ReadAsStringAsync()).RootElement.GetProperty("data");
        Assert.True(o.GetProperty("probability").GetDouble() > 0);
        Assert.NotEmpty(o.GetProperty("drivers").EnumerateArray().ToArray());
        Assert.Equal("San Roque", o.GetProperty("muni").GetString());
    }

    [Fact]
    public async Task Ingest_without_cron_key_returns_401()
    {
        using var f = new SmokeFactory();
        var c = f.CreateClient();
        var r = await c.PostAsJsonAsync("/api/surveillance/ingest/pidsr", new { sourceKey = "smoke-2" });
        Assert.Equal(HttpStatusCode.Unauthorized, r.StatusCode);
    }

    [Fact]
    public async Task Alert_ack_flow()
    {
        using var f = new SmokeFactory();
        var c = f.CreateClient();
        Bearer(c, await LoginAsync(c));

        var list = await c.GetAsync("/api/alerts");
        list.EnsureSuccessStatusCode();
        var id = JsonDocument.Parse(await list.Content.ReadAsStringAsync())
            .RootElement.GetProperty("data")[0].GetProperty("id").GetInt64();

        var ack = await c.PostAsync($"/api/alerts/{id}/ack", null);
        ack.EnsureSuccessStatusCode();
        Assert.Equal("acked", JsonDocument.Parse(await ack.Content.ReadAsStringAsync())
            .RootElement.GetProperty("data").GetProperty("status").GetString());
    }
}
