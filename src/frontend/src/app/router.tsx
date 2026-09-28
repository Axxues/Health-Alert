import { Suspense, lazy } from "react";
import { Navigate, Outlet, createBrowserRouter } from "react-router";
import { hasPermission, isAuthenticated } from "@/utils/auth";

const Layout = lazy(() => import("@/layouts/Layout").then((m) => ({ default: m.Layout })));
const Login = lazy(() => import("@/pages/Login").then((m) => ({ default: m.Login })));
const Unauthorized = lazy(() => import("@/pages/Unauthorized").then((m) => ({ default: m.Unauthorized })));
const Placeholder = lazy(() => import("@/pages/Placeholder").then((m) => ({ default: m.Placeholder })));

function ProtectedRoute() {
  return isAuthenticated() ? <Outlet /> : <Navigate to="/login" replace />;
}

function PermissionRoute({ permission }: { permission: string }) {
  return hasPermission(permission) ? <Outlet /> : <Navigate to="/unauthorized" replace />;
}

const page = (title: string) => (
  <Suspense fallback={<p className="muted">Loading…</p>}>
    <Placeholder title={title} />
  </Suspense>
);

// ponytail: one placeholder page for all slices until Task 6 builds real slices
export const router = createBrowserRouter([
  { path: "/login", element: <Suspense fallback={null}><Login /></Suspense> },
  { path: "/unauthorized", element: <Suspense fallback={null}><Unauthorized /></Suspense> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <Suspense fallback={null}><Layout /></Suspense>,
        children: [
          { index: true, element: page("Dashboard") },
          { path: "forecast", element: <PermissionRoute permission="forecast:view" />, children: [{ index: true, element: page("Forecast") }] },
          { path: "surveillance", element: page("Surveillance") },
          { path: "risk-maps", element: page("Risk maps") },
          { path: "rag", element: page("Ask the library") },
          { path: "playbooks", element: page("Playbooks") },
          { path: "alerts", element: page("Alerts") },
          { path: "citizen", element: page("Citizen") },
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
