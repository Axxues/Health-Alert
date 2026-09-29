import { PERMISSIONS } from "@/constants/permissions";

export interface MenuItem {
  name: string;
  path: string;
  permission?: string;
  section: "Epidemiology" | "Outbreak Response" | "Administration";
}

export const menuItems: MenuItem[] = [
  // Epidemiology & Surveillance
  { name: "Dashboard", path: "/", permission: PERMISSIONS.dashboardView, section: "Epidemiology" },
  { name: "Forecast", path: "/forecast", permission: PERMISSIONS.forecastView, section: "Epidemiology" },
  { name: "Surveillance", path: "/surveillance", permission: PERMISSIONS.surveillanceView, section: "Epidemiology" },
  { name: "Risk maps", path: "/risk-maps", permission: PERMISSIONS.riskmapsView, section: "Epidemiology" },

  // Outbreak Response & Logistics
  { name: "Ask the library", path: "/rag", permission: PERMISSIONS.ragView, section: "Outbreak Response" },
  { name: "Playbooks", path: "/playbooks", permission: PERMISSIONS.playbookView, section: "Outbreak Response" },
  { name: "Alerts", path: "/alerts", permission: PERMISSIONS.alertsView, section: "Outbreak Response" },
  { name: "Citizen", path: "/citizen", permission: PERMISSIONS.citizenView, section: "Outbreak Response" },
  { name: "Medicine & Supplies", path: "/medicine", section: "Outbreak Response" },

  // Administration & Governance
  { name: "Reports", path: "/reports", section: "Administration" },
  { name: "Messaging", path: "/messaging", section: "Administration" },
  { name: "Users", path: "/users", section: "Administration" },
  { name: "System", path: "/system", section: "Administration" },
];
