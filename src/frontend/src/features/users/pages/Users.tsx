import { useEffect, useState } from "react";
import {
  Users as UsersIcon,
  UserPlus,
  Shield,
  UserCheck,
  AlertTriangle,
  UserX,
} from "lucide-react";
import { createUser, listUsers, setUserActive, setUserRole } from "@/services/users/api/users.api";
import type { User } from "@/services/users/types/users.types";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
  Dialog,
  Input,
  Select,
  MetricCard,
  PageHeader,
} from "@/components/ui";

export function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("Viewer");
  const [saving, setSaving] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

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
  const activeCount = users.filter((u) => u.isActive).length;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    setSaving(true);
    await createUser({ username: username.trim(), role })
      .then(() => {
        setUsername("");
        setRole("Viewer");
        setAddOpen(false);
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="User Access & Security Management"
        description="Role-based access control directory for regional epidemiologists, surveillance officers, and municipal data encoders."
        badge={
          <Badge variant="primary">
            {users.length} Active System Accounts
          </Badge>
        }
        actions={
          <Button
            variant="primary"
            size="sm"
            icon={<UserPlus size={14} />}
            onClick={() => setAddOpen(true)}
          >
            Add New User
          </Button>
        }
      />

      {/* KPI Account Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard
          title="Active Accounts"
          value={activeCount}
          subtitle={`${users.length - activeCount} deactivated`}
          variant="success"
          icon={<UserCheck size={16} />}
        />
        <MetricCard
          title="System Administrators"
          value={admins}
          subtitle="Full model retraining & ingestion access"
          variant="default"
          icon={<Shield size={16} />}
        />
        <MetricCard
          title="Surveillance Viewers"
          value={viewers}
          subtitle="Read-only dashboard & bulletin access"
          variant="default"
          icon={<UsersIcon size={16} />}
        />
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-xs font-medium text-destructive">
          <AlertTriangle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* User Directory Table Card */}
      <Card>
        <CardHeader className="pb-3 border-b border-border/60 flex flex-row items-center justify-between">
          <CardTitle>User Directory</CardTitle>
          <Button variant="outline" size="sm" onClick={refresh}>
            Refresh
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User Account</TableHead>
                <TableHead>Assigned Role</TableHead>
                <TableHead>Account Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-12 text-center text-xs text-muted-foreground">
                    Loading user directory...
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableEmpty colSpan={4} message="No registered users found in the system." />
              ) : (
                users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs uppercase">
                          {u.username.slice(0, 2)}
                        </div>
                        <span className="font-bold text-foreground">{u.username}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge variant={u.role === "Admin" ? "primary" : "neutral"}>
                        {u.role}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <Badge variant={u.isActive ? "success" : "danger"}>
                        {u.isActive ? "Active" : "Deactivated"}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <select
                          value={u.role}
                          onChange={(e) => handleRole(u.id, e.target.value)}
                          className="h-8 rounded-lg border border-input bg-card px-2 text-xs text-foreground focus-visible:outline-none"
                        >
                          <option value="Admin">Admin</option>
                          <option value="Viewer">Viewer</option>
                        </select>

                        <Button
                          variant={u.isActive ? "outline" : "secondary"}
                          size="sm"
                          icon={u.isActive ? <UserX size={12} /> : <UserCheck size={12} />}
                          onClick={() => handleActive(u.id, !u.isActive)}
                        >
                          {u.isActive ? "Deactivate" : "Activate"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add User Dialog Modal */}
      <Dialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Register New User Account"
        description="Provision access credentials for a surveillance health officer or administrator."
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={saving}
              disabled={!username.trim()}
              onClick={handleAdd}
            >
              Create Account
            </Button>
          </>
        }
      >
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-muted-foreground block mb-1">
              Username or ID *
            </label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. jdoe_resu"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-muted-foreground block mb-1">
              Role Permission Tier *
            </label>
            <Select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="Admin">Admin (Full administrative & retrain access)</option>
              <option value="Viewer">Viewer (Read-only surveillance telemetry)</option>
            </Select>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
