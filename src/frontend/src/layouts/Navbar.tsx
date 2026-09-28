import { Link, useNavigate } from "react-router";
import { clearSession } from "@/utils/auth";

export function Navbar() {
  const navigate = useNavigate();
  return (
    <header className="topbar">
      <Link to="/" style={{ textDecoration: "none", color: "inherit", fontWeight: 400 }}>
        Health Alert
      </Link>
      <button
        className="btn-pill btn-pill--ghost"
        onClick={() => { clearSession(); navigate("/login"); }}
      >
        Sign out
      </button>
    </header>
  );
}
