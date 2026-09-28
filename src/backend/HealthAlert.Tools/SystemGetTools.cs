namespace HealthAlert.Tools;

public class SystemGetTools
{
    public object Status() => new { ok = true, version = "mvp" };
}
