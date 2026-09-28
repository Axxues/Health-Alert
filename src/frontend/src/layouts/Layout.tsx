import { Outlet } from "react-router";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";

export function Layout() {
  return (
    <div>
      <Navbar />
      <div className="shell">
        <Sidebar />
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
