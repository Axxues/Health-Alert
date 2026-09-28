namespace HealthAlert.Tools;

public class MessagingGetTools
{
    public object Send(string? to, string? message) => new { to, status = "queued" };
}
