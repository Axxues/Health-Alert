import { Suspense, lazy } from "react";
import { Navigate, Outlet, createBrowserRouter } from "react-router";
import { hasPermission, isAuthenticated } from "@/utils/auth";
import { PERMISSIONS } from "@/constants/permissions";

const Layout = lazy(() => import("@/layouts/Layout").then((m) => ({ default: m.Layout })));
const Login = lazy(() => import("@/features/auth/pages/Login").then((m) => ({ default: m.Login })));
const Unauthorized = lazy(() => import("@/features/auth/pages/Unauthorized").then((m) => ({ default: m.Unauthorized })));
const Dashboard = lazy(() => import("@/features/dashboard/pages/Dashboard").then((m) => ({ default: m.Dashboard })));
const Intelligence = lazy(() => import("@/features/intelligence/pages/Intelligence").then((m) => ({ default: m.Intelligence })));
const LocationDetail = lazy(() =>
  import("@/features/intelligence/pages/LocationDetail").then((m) => ({ default: m.LocationDetail }))
);
const RiskMaps = lazy(() => import("@/features/risk-maps/pages/RiskMaps").then((m) => ({ default: m.RiskMaps })));
const Alerts = lazy(() => import("@/features/alerts/pages/Alerts").then((m) => ({ default: m.Alerts })));
const Reports = lazy(() => import("@/features/reports/pages/Reports").then((m) => ({ default: m.Reports })));

function ProtectedRoute() {
  return isAuthenticated() ? <Outlet /> : <Navigate to="/login" replace />;
}

function PermissionRoute({ permission, children }: { permission: string; children?: React.ReactNode }) {
  if (!hasPermission(permission)) return <Navigate to="/unauthorized" replace />;
  return children ?? <Outlet />;
}

function IntelligenceGate() {
  if (!hasPermission(PERMISSIONS.forecastView) && !hasPermission(PERMISSIONS.surveillanceView))
    return <Navigate to="/unauthorized" replace />;
  return <Outlet />;
}

const slice = (el: React.ReactNode) => (
  <Suspense fallback={<p className="muted" style={{ padding: "32px", textAlign: "center" }}>Loading surveillance telemetry…</p>}>{el}</Suspense>
);

const guard = (permission: string, el: React.ReactNode) => ({
  element: <PermissionRoute permission={permission} />,
  children: [{ index: true, element: slice(el) }],
});

export const router = createBrowserRouter([
  { path: "/login", element: <Suspense fallback={null}><Login /></Suspense> },
  { path: "/unauthorized", element: <Suspense fallback={null}><Unauthorized /></Suspense> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <Suspense fallback={null}><Layout /></Suspense>,
        children: [
          { index: true, element: slice(<PermissionRoute permission={PERMISSIONS.dashboardView}><Dashboard /></PermissionRoute>) },
          {
            path: "intelligence",
            element: <IntelligenceGate />,
            children: [
              { index: true, element: slice(<Intelligence />) },
              { path: ":locationId", element: slice(<LocationDetail />) },
            ],
          },
          {
            path: "forecast",
            element: <IntelligenceGate />,
            children: [
              { index: true, element: slice(<Intelligence />) },
              { path: ":locationId", element: slice(<LocationDetail />) },
            ],
          },
          {
            path: "surveillance",
            element: <IntelligenceGate />,
            children: [
              { index: true, element: slice(<Intelligence />) },
              { path: ":locationId", element: slice(<LocationDetail />) },
            ],
          },
          { path: "risk-maps", ...guard(PERMISSIONS.riskmapsView, <RiskMaps />) },
          { path: "alerts", ...guard(PERMISSIONS.alertsView, <Alerts />) },
          { path: "reports", element: slice(<Reports />) },
        ],
      },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);
