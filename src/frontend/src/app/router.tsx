import { Suspense, lazy } from "react";
import { Navigate, Outlet, createBrowserRouter } from "react-router";
import { hasPermission, isAuthenticated } from "@/utils/auth";

const Layout = lazy(() => import("@/layouts/Layout").then((m) => ({ default: m.Layout })));
const Login = lazy(() => import("@/pages/Login").then((m) => ({ default: m.Login })));
const Unauthorized = lazy(() => import("@/pages/Unauthorized").then((m) => ({ default: m.Unauthorized })));
const Placeholder = lazy(() => import("@/pages/Placeholder").then((m) => ({ default: m.Placeholder })));
const DashboardPage = lazy(() => import("@/features/dashboard/pages/DashboardPage").then((m) => ({ default: m.DashboardPage })));
const ForecastingPage = lazy(() => import("@/features/forecasting/pages/ForecastingPage").then((m) => ({ default: m.ForecastingPage })));
const SurveillancePage = lazy(() => import("@/features/surveillance/pages/SurveillancePage").then((m) => ({ default: m.SurveillancePage })));
const RiskMapsPage = lazy(() => import("@/features/risk-maps/pages/RiskMapsPage").then((m) => ({ default: m.RiskMapsPage })));
const RagPage = lazy(() => import("@/features/rag/pages/RagPage").then((m) => ({ default: m.RagPage })));
const PlaybooksPage = lazy(() => import("@/features/playbooks/pages/PlaybooksPage").then((m) => ({ default: m.PlaybooksPage })));
const AlertsPage = lazy(() => import("@/features/alerts/pages/AlertsPage").then((m) => ({ default: m.AlertsPage })));
const CitizenPage = lazy(() => import("@/features/citizen/pages/CitizenPage").then((m) => ({ default: m.CitizenPage })));

function ProtectedRoute() {
  return isAuthenticated() ? <Outlet /> : <Navigate to="/login" replace />;
}

function PermissionRoute({ permission }: { permission: string }) {
  return hasPermission(permission) ? <Outlet /> : <Navigate to="/unauthorized" replace />;
}

const slice = (el: React.ReactNode) => (
  <Suspense fallback={<p className="muted">Loading…</p>}>{el}</Suspense>
);

const page = (title: string) => (
  <Suspense fallback={<p className="muted">Loading…</p>}>
    <Placeholder title={title} />
  </Suspense>
);

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
          { index: true, element: slice(<DashboardPage />) },
          { path: "forecast", element: <PermissionRoute permission="forecast:view" />, children: [{ index: true, element: slice(<ForecastingPage />) }] },
          { path: "surveillance", element: slice(<SurveillancePage />) },
          { path: "risk-maps", element: slice(<RiskMapsPage />) },
          { path: "rag", element: slice(<RagPage />) },
          { path: "playbooks", element: slice(<PlaybooksPage />) },
          { path: "alerts", element: slice(<AlertsPage />) },
          { path: "citizen", element: slice(<CitizenPage />) },
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
