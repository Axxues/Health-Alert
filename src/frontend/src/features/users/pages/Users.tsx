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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-medium text-blue-600 dark:text-blue-400">
              <UserCheck size={13} strokeWidth={2.2} />
              Role-Based Access Control (RBAC)
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Public Health Officers & Users
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Credentialed epidemiologists, municipal health officers, and field surveillance teams authorized under RA 10173.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
          >
            <UserPlus size={14} strokeWidth={2.2} />
            <span>Add Health Officer</span>
          </button>
        </div>
      </div>

      {/* Directory Table Card */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 py-4 border-b border-border bg-muted/40">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Authorized Field & Clinical Personnel
            </h3>
            <p className="text-xs text-muted-foreground">
              {users.length} active officer accounts with verified credentials.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              placeholder="Search officer name, role..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-md border border-input bg-background pl-9 pr-4 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div className="p-5">
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-muted/40 text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-4 py-3 font-semibold uppercase tracking-wider">Officer Identity</th>
                  <th className="px-4 py-3 font-semibold uppercase tracking-wider">Role & Authorization</th>
                  <th className="px-4 py-3 font-semibold uppercase tracking-wider">Assigned Station</th>
                  <th className="px-4 py-3 font-semibold uppercase tracking-wider">Session Status</th>
                  <th className="px-4 py-3 font-semibold uppercase tracking-wider text-right">Last Telemetry</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs font-mono">
                          {u.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-foreground text-[13px]">{u.name}</div>
                          <div className="text-[11px] text-muted-foreground font-mono">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-600 dark:text-blue-400">
                        <Shield size={11} strokeWidth={2.2} />
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {u.station}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {u.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[11px] text-muted-foreground">
                      {u.lastActive}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border pb-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <UserPlus size={18} strokeWidth={2.2} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">Authorize Health Officer</h3>
                  <p className="text-xs text-muted-foreground">Register public health credentials</p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                type="button"
                className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X size={16} strokeWidth={2.2} />
              </button>
            </div>

            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Full Name & Title
                </label>
                <input
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="e.g. Dr. Roberto Diaz or Juanita Cruz, RN"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Official DOH / LGU Email
                </label>
                <input
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  type="email"
                  placeholder="name@doh.gov.ph"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  System Role Permission
                </label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                >
                  <option value="Municipal Health Officer">Municipal Health Officer (Full Access)</option>
                  <option value="Surveillance Officer">Surveillance Officer (Forecast & Feeds)</option>
                  <option value="Field Epidemiologist">Field Epidemiologist (Playbooks & Hotspots)</option>
                  <option value="BHW Supervisor">BHW Supervisor (Community Triage)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-md border border-border px-3.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
                >
                  <UserCheck size={13} strokeWidth={2.2} />
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
