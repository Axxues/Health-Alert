using Microsoft.AspNetCore.SignalR;

namespace HealthAlert.Api.Hubs;

// ponytail: in-memory groups; Redis backplane if multi-node
public class NotificationHub : Hub
{
    public Task Join(string disease, string muni) =>
        Groups.AddToGroupAsync(Context.ConnectionId, $"forecast.{disease}.{muni}");

    public Task Broadcast(string disease, string muni, object run) =>
        Clients.Group($"forecast.{disease}.{muni}").SendAsync("update", run);
}
