// ponytail: mirror of backend HealthAlert.Common.Permissions — change both together
export const PERMISSIONS = {
  forecastView: "surveillance:forecast:view",
  surveillanceView: "surveillance:feeds:view",
  riskmapsView: "riskmaps:hotspots:view",
  ragView: "rag:answer:view",
  playbookView: "playbook:list:view",
  alertsView: "alerts:list:view",
  citizenView: "citizen:ask:view",
  dashboardView: "dashboard:view",
} as const;
