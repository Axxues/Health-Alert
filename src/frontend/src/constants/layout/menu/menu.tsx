import { PERMISSIONS } from "@/constants/permissions";

export type MenuSection = "Surveillance & Telemetry" | "Incident Operations" | "Administration";

export interface MenuItem {
  name: string;
  path: string;
  permission?: string;
  section: MenuSection;
}

export const menuItems: MenuItem[] = [
  // Surveillance & Telemetry
  { name: "Dashboard", path: "/", permission: PERMISSIONS.dashboardView, section: "Surveillance & Telemetry" },
  { name: "Intelligence", path: "/intelligence", section: "Surveillance & Telemetry" },
  { name: "Risk maps", path: "/risk-maps", permission: PERMISSIONS.riskmapsView, section: "Surveillance & Telemetry" },

  // Incident Operations
  { name: "Alerts", path: "/alerts", permission: PERMISSIONS.alertsView, section: "Incident Operations" },
  { name: "Reports", path: "/reports", section: "Incident Operations" },

  // Administration
  { name: "Uploads", path: "/uploads", section: "Administration" },
  { name: "Users", path: "/users", section: "Administration" },
];
