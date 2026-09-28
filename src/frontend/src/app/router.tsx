import { Suspense, lazy } from "react";
import { Navigate, Outlet, createBrowserRouter } from "react-router";
import { hasPermission, isAuthenticated } from "@/utils/auth";
import { PERMISSIONS } from "@/constants/permissions";

const Layout = lazy(() => import("@/layouts/Layout").then((m) => ({ default: m.Layout })));
const Login = lazy(() => import("@/features/auth/pages/Login").then((m) => ({ default: m.Login })));
const Unauthorized = lazy(() => import("@/features/auth/pages/Unauthorized").then((m) => ({ default: m.Unauthorized })));
const Placeholder = lazy(() => import("@/components/shared/Placeholder").then((m) => ({ default: m.Placeholder })));
const Dashboard = lazy(() => import("@/features/dashboard/pages/Dashboard").then((m) => ({ default: m.Dashboard })));
const Forecast = lazy(() => import("@/features/forecasting/pages/Forecast").then((m) => ({ default: m.Forecast })));
const Surveillance = lazy(() => import("@/features/surveillance/pages/Surveillance").then((m) => ({ default: m.Surveillance })));
const RiskMaps = lazy(() => import("@/features/risk-maps/pages/RiskMaps").then((m) => ({ default: m.RiskMaps })));
const Rag = lazy(() => import("@/features/rag/pages/Rag").then((m) => ({ default: m.Rag })));
const Playbooks = lazy(() => import("@/features/playbooks/pages/Playbooks").then((m) => ({ default: m.Playbooks })));
const Alerts = lazy(() => import("@/features/alerts/pages/Alerts").then((m) => ({ default: m.Alerts })));
const Citizen = lazy(() => import("@/features/citizen/pages/Citizen").then((m) => ({ default: m.Citizen })));

function ProtectedRoute() {
  return isAuthenticated() ? <Outlet /> : <Navigate to="/login" replace />;
}

function PermissionRoute({ permission, children }: { permission: string; children?: React.ReactNode }) {
  if (!hasPermission(permission)) return <Navigate to="/unauthorized" replace />;
  return children ?? <Outlet />;
}

const slice = (el: React.ReactNode) => (
  <Suspense fallback={<p className="muted">Loading…</p>}>{el}</Suspense>
);

const page = (title: string) => (
  <Suspense fallback={<p className="muted">Loading…</p>}>
    <Placeholder title={title} />
  </Suspense>
);

const guard = (permission: string, el: React.ReactNode) => ({
  element: <PermissionRoute permission={permission} />,
  children: [{ index: true, element: slice(el) }],
});

// ponytail: real slices for Task 6; reports/users/messaging/system stay placeholder until needed
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
          { path: "forecast", ...guard(PERMISSIONS.forecastView, <Forecast />) },
          { path: "surveillance", ...guard(PERMISSIONS.surveillanceView, <Surveillance />) },
          { path: "risk-maps", ...guard(PERMISSIONS.riskmapsView, <RiskMaps />) },
          { path: "rag", ...guard(PERMISSIONS.ragView, <Rag />) },
          { path: "playbooks", ...guard(PERMISSIONS.playbookView, <Playbooks />) },
          { path: "alerts", ...guard(PERMISSIONS.alertsView, <Alerts />) },
          { path: "citizen", ...guard(PERMISSIONS.citizenView, <Citizen />) },
          { path: "reports", element: page("Reports") },
          { path: "users", element: page("Users") },
          { path: "messaging", element: page("Messaging") },
          { path: "system", element: page("System") },
        ],
      },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);
