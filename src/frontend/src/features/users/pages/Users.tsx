import { useEffect, useState } from "react";
import { createUser, listUsers, setUserActive, setUserRole } from "@/services/users/api/users.api";
import type { User } from "@/services/users/types/users.types";

export function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("Viewer");
  const [saving, setSaving] = useState(false);

  const refresh = () => {
    setLoading(true);
    setError("");
    listUsers()
      .then(setUsers)
      .catch(() => setError("Failed to retrieve user ledger."))
      .finally(() => setLoading(false));
  };

  useEffect(refresh, []);

  const admins = users.filter((u) => u.role === "Admin").length;
  const viewers = users.filter((u) => u.role !== "Admin").length;

  const handleAdd = async () => {
    if (!username.trim()) return;
    setSaving(true);
    await createUser({ username: username.trim(), role })
      .then(() => {
        setUsername("");
        setRole("Viewer");
        refresh();
      })
      .catch(() => setError("Failed to create user."))
      .finally(() => setSaving(false));
  };

  const handleRole = async (id: number, next: string) => {
    await setUserRole(id, next).catch(() => setError("Failed to update role."));
    refresh();
  };

  const handleActive = async (id: number, active: boolean) => {
    await setUserActive(id, active).catch(() => setError("Failed to update status."));
    refresh();
  };

  const selectClass =
    "bg-transparent border border-input rounded-md text-xs text-foreground focus:outline-none cursor-pointer px-2.5 py-2 shadow-xs";

  return (
    <div className="page-doc" style={{ display: "grid", gap: 20 }}>
      <div>
        <h1 style={{ margin: "0 0 4px", fontSize: "24px", fontWeight: 800, letterSpacing: "-0.02em" }}>
          Users
        </h1>
        <p style={{ margin: 0, fontSize: "13px", color: "var(--mute)" }}>
          {users.length} users, {admins} admins, {viewers} viewers
        </p>
      </div>

      <div className="section-card" style={{ padding: 20, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          aria-label="Username"
          style={{ padding: 10, background: "var(--background)", border: "1px solid var(--input)", borderRadius: 8, fontSize: "13px", color: "var(--ink)" }}
        />
        <select value={role} onChange={(e) => setRole(e.target.value)} className={selectClass} aria-label="Role">
          <option value="Admin">Admin</option>
          <option value="Viewer">Viewer</option>
        </select>
        <button type="button" className="btn-pill text-xs" onClick={handleAdd} disabled={saving || !username.trim()}>
          {saving ? "Adding..." : "Add"}
        </button>
      </div>

      {error ? (
        <p style={{ fontSize: "13px", color: "var(--red)" }}>{error}</p>
      ) : loading ? (
        <p style={{ padding: "32px 0", textAlign: "center", color: "var(--mute)", fontSize: "13px" }}>
          Loading user ledger...
        </p>
      ) : users.length === 0 ? (
        <p style={{ padding: "32px 0", textAlign: "center", color: "var(--mute)", fontSize: "13px" }}>
          No users found.
        </p>
      ) : (
        <div style={{ border: "1px solid var(--hairline)", borderRadius: 12, overflowX: "auto", background: "var(--card)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", minWidth: 640 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--hairline)", background: "var(--muted)" }}>
                {(["Username", "Role", "Status"] as const).map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      fontSize: "11.5px",
                      fontWeight: 600,
                      color: "var(--mute)",
                      padding: "10px 16px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
                <th style={{ width: 220 }} aria-label="Action" />
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: "1px solid var(--hairline)" }}>
                  <td style={{ padding: "11px 16px", fontWeight: 700, color: "var(--ink)", whiteSpace: "nowrap" }}>{u.username}</td>
                  <td style={{ padding: "11px 16px", color: "var(--ink)", whiteSpace: "nowrap" }}>{u.role}</td>
                  <td style={{ padding: "11px 16px", whiteSpace: "nowrap", color: u.isActive ? "var(--green)" : "var(--red)" }}>
                    {u.isActive ? "Active" : "Deactivated"}
                  </td>
                  <td style={{ padding: "11px 16px", textAlign: "right", whiteSpace: "nowrap" }}>
                    <select
                      value={u.role}
                      onChange={(e) => handleRole(u.id, e.target.value)}
                      className={selectClass}
                      aria-label={`Role for ${u.username}`}
                    >
                      <option value="Admin">Admin</option>
                      <option value="Viewer">Viewer</option>
                    </select>{" "}
                    <button type="button" className="btn-pill text-xs" onClick={() => handleActive(u.id, !u.isActive)}>
                      {u.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
