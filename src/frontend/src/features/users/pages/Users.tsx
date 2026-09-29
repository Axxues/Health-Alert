import { useState } from "react";
import { UserCheck, UserPlus, Search, Shield, X } from "lucide-react";

interface Officer {
  id: string;
  name: string;
  email: string;
  role: string;
  station: string;
  status: "Active" | "Standby";
  lastActive: string;
}

const OFFICERS: Officer[] = [
  { id: "USR-001", name: "Dr. Maria Santos", email: "mho.sanfernando@doh.gov.ph", role: "Municipal Health Officer", station: "San Fernando RHU Main", status: "Active", lastActive: "Just now" },
  { id: "USR-002", name: "Dr. Andres Ramos", email: "pesu.lead@launion.gov.ph", role: "Provincial Epidemiologist", station: "Provincial Health Office", status: "Active", lastActive: "14m ago" },
  { id: "USR-003", name: "Elena Valenzuela, RN", email: "evalenzuela@rhu.gov.ph", role: "Surveillance Nurse Lead", station: "RHU Outpatient Clinic", status: "Active", lastActive: "1h ago" },
  { id: "USR-004", name: "Carmela De Dios", email: "bhw.lead.central@gov.ph", role: "BHW Field Supervisor", station: "Barangay Central Health Post", status: "Active", lastActive: "2h ago" },
  { id: "USR-005", name: "Engr. Carlo Reyes", email: "admin.telemetry@doh.gov.ph", role: "System & Data Administrator", station: "Central Ingestion Hub", status: "Active", lastActive: "35m ago" },
];

export function Users() {
  const [users, setUsers] = useState<Officer[]>(OFFICERS);
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("Surveillance Officer");

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(query.toLowerCase()) ||
      u.role.toLowerCase().includes(query.toLowerCase()) ||
      u.station.toLowerCase().includes(query.toLowerCase())
  );

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;
    const added: Officer = {
      id: `USR-00${users.length + 1}`,
      name: newName,
      email: newEmail,
      role: newRole,
      station: "RHU Surveillance Station",
      status: "Active",
      lastActive: "Just registered",
    };
    setUsers([...users, added]);
    setNewName("");
    setNewEmail("");
    setModalOpen(false);
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      {/* Header */}
      <div className="dash-head" style={{ margin: "0 0 4px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span className="pill pill--primary" style={{ fontSize: "11px" }}>
              <UserCheck size={13} strokeWidth={2.2} />
              Role-Based Access Control (RBAC)
            </span>
          </div>
          <h1>Public Health Officers & Users</h1>
          <p className="sub">
            Credentialed epidemiologists, municipal health officers, and field surveillance teams authorized under RA 10173.
          </p>
        </div>

        <div className="dash-actions">
          <button className="btn-pill" onClick={() => setModalOpen(true)}>
            <UserPlus size={15} strokeWidth={2.2} />
            <span>Add Health Officer</span>
          </button>
        </div>
      </div>

      {/* Directory Table Card */}
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16 }}>Authorized Field & Clinical Personnel</h3>
            <p className="sub">{users.length} active officer accounts with verified credentials.</p>
          </div>

          <label className="search" style={{ maxWidth: 300, background: "var(--card-subtle)" }}>
            <Search size={15} strokeWidth={2.2} style={{ color: "var(--mute)" }} />
            <input
              placeholder="Search officer name, role..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Officer Identity</th>
                <th>Role & Authorization</th>
                <th>Assigned Station</th>
                <th>Session Status</th>
                <th>Last Telemetry Activity</th>
              </tr>
            </thead>
            <tbody className="tabular">
              {filtered.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div className="avatar" style={{ width: 34, height: 34, fontSize: "12px" }}>
                        {u.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: "var(--ink)" }}>{u.name}</div>
                        <div style={{ fontSize: "11.5px", color: "var(--mute)" }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="pill pill--primary" style={{ fontSize: "11.5px" }}>
                      <Shield size={11} strokeWidth={2.2} />
                      {u.role}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: "var(--ink-secondary)" }}>{u.station}</span>
                  </td>
                  <td>
                    <span className="pill pill--ok" style={{ fontSize: "11.5px" }}>
                      <span className="dot dot--pulse" />
                      {u.status}
                    </span>
                  </td>
                  <td style={{ color: "var(--mute)" }}>{u.lastActive}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {modalOpen && (
        <div className="overlay" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div className="card anim" style={{ width: "100%", maxWidth: 480, position: "relative", zIndex: 40 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <UserPlus size={18} strokeWidth={2.2} style={{ color: "var(--primary)" }} />
                <h3 style={{ margin: 0, fontSize: 17 }}>Authorize New Health Officer</h3>
              </div>
              <button className="iconbtn" onClick={() => setModalOpen(false)} style={{ width: 32, height: 32 }} type="button">
                <X size={16} strokeWidth={2.2} />
              </button>
            </div>

            <form onSubmit={handleAdd} style={{ display: "grid", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--mute)", marginBottom: 6 }}>
                  FULL NAME & TITLE
                </label>
                <input
                  className="input"
                  style={{ width: "100%" }}
                  placeholder="e.g. Dr. Roberto Diaz or Juanita Cruz, RN"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--mute)", marginBottom: 6 }}>
                  OFFICIAL DOH / LGU EMAIL
                </label>
                <input
                  className="input"
                  style={{ width: "100%" }}
                  type="email"
                  placeholder="name@doh.gov.ph"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--mute)", marginBottom: 6 }}>
                  SYSTEM ROLE PERMISSION
                </label>
                <select
                  className="input"
                  style={{ width: "100%" }}
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                >
                  <option value="Municipal Health Officer">Municipal Health Officer (Full Access)</option>
                  <option value="Surveillance Officer">Surveillance Officer (Forecast & Feeds)</option>
                  <option value="Field Epidemiologist">Field Epidemiologist (Playbooks & Hotspots)</option>
                  <option value="BHW Supervisor">BHW Supervisor (Community Triage)</option>
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                <button className="btn-pill btn-pill--ghost" type="button" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button className="btn-pill" type="submit">
                  <UserCheck size={14} strokeWidth={2.2} />
                  <span>Authorize Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
