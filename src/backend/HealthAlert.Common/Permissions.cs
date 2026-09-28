namespace HealthAlert.Common;

// ponytail: one string both sides read; frontend mirrors in src/constants/permissions.ts — change both together
public static class Permissions
{
    public const string DashboardView = "dashboard:view";
    public const string ForecastView = "surveillance:forecast:view";
    public const string SurveillanceView = "surveillance:feeds:view";
    public const string RiskmapsView = "riskmaps:hotspots:view";
    public const string RagView = "rag:answer:view";
    public const string PlaybookView = "playbook:list:view";
    public const string AlertsView = "alerts:list:view";
    public const string CitizenView = "citizen:ask:view";
}
