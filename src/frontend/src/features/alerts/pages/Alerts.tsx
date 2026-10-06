import { useEffect, useMemo, useState } from "react";
import {
  Send,
  AlertTriangle,
  CheckCircle2,
  Radio,
  Check,
} from "lucide-react";
import { ackAlert, broadcastAlert, listAlerts } from "@/services/alerts/api/alerts.api";
import type { Alert } from "@/services/alerts/types/alerts.types";
import { getRole } from "@/utils/auth";
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
  Tabs,
  MetricCard,
  PageHeader,
  Skeleton,
  TableRowSkeleton,
} from "@/components/ui";

const MUNIS = ["San Fernando City", "Agoo", "Bauang", "Bacnotan", "San Juan"];

type StatusFilter = "all" | "new" | "acked" | "resolved";

export function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [kind, setKind] = useState("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [muni, setMuni] = useState(MUNIS[0]);
  const [message, setMessage] = useState("");
  const [playbookCode, setPlaybookCode] = useState("");
  const [sending, setSending] = useState(false);

  const isAdmin = getRole() === "Admin";

  // ponytail: backend TblAlert fields are nullable; seed/system rows store null kind/status
  const lc = (v: string | null | undefined) => (v ?? "").toLowerCase();

  const refresh = () => {
    setLoading(true);
    setError("");
    listAlerts()
      .then(setAlerts)
      .catch(() => setError("Failed to retrieve alert ledger."))
      .finally(() => setLoading(false));
  };

  useEffect(refresh, []);

  const filtered = useMemo(
    () =>
      alerts.filter(
        (a) =>
          (kind === "all" || lc(a.kind) === kind) &&
          (status === "all" || lc(a.status) === status)
      ),
    [alerts, kind, status]
  );

  const openAuto = alerts.filter(
    (a) => lc(a.kind) === "auto" && lc(a.status) === "new"
  ).length;
  const openManual = alerts.filter(
    (a) => lc(a.kind) === "manual" && lc(a.status) === "new"
  ).length;

  const handleAck = async (id: number) => {
    await ackAlert(id).catch(() => setError("Failed to acknowledge alert."));
    refresh();
  };

  const handleSend = async () => {
    if (!message.trim()) return;
    setSending(true);
    await broadcastAlert({ muni, message: message.trim(), playbookCode: playbookCode.trim() || null })
      .then(() => {
        setMessage("");
        setPlaybookCode("");
        setBroadcastOpen(false);
        refresh();
      })
      .catch(() => setError("Failed to broadcast alert."))
      .finally(() => setSending(false));
  };

  const statusBadge = (s: string | null | undefined) => {
    const sl = lc(s);
    if (sl === "new") return <Badge variant="danger" pulse>New Alert</Badge>;
    if (sl === "acked") return <Badge variant="warning">Acknowledged</Badge>;
    return <Badge variant="success">Resolved</Badge>;
  };

  const kindBadge = (k: string | null | undefined) => {
    const kl = lc(k);
    if (kl === "auto") return <Badge variant="primary">Model Surge</Badge>;
    return <Badge variant="outline">Manual Broadcast</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Outbreak Alert Triage Ledger"
        description="Unified ledger tracking automated early-warning surge alerts and broadcast direct notifications across municipal health units."
        badge={
          <Badge variant="primary">
            {alerts.length} Total Registered Alerts
          </Badge>
        }
        actions={
          isAdmin ? (
            <Button
              variant="destructive"
              size="sm"
              icon={<Send size={14} />}
              onClick={() => setBroadcastOpen(true)}
            >
              Broadcast Alert
            </Button>
          ) : undefined
        }
      />

      {/* KPI Triage Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {loading ? (
          <>
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </>
        ) : (
          <>
            <MetricCard
              title="Active Model Outbreak Alerts"
              value={openAuto}
              subtitle="Model surge thresholds breached"
              variant={openAuto > 0 ? "critical" : "default"}
              icon={<AlertTriangle size={16} />}
            />
            <MetricCard
              title="Manual Field Broadcasts"
              value={openManual}
              subtitle="Direct emergency notices pending review"
              variant={openManual > 0 ? "warning" : "default"}
              icon={<Radio size={16} />}
            />
            <MetricCard
              title="Total Resolved Alerts"
              value={alerts.filter((a) => lc(a.status) === "resolved").length}
              subtitle="Closed epidemiological incidents"
              variant="success"
              icon={<CheckCircle2 size={16} />}
            />
          </>
        )}
      </div>

      {/* Triage Toolbar */}
      <Card className="p-3.5 flex items-center justify-between gap-4 flex-wrap bg-card shadow-xs">
        <div className="flex items-center gap-3 flex-wrap">
          <Tabs<StatusFilter>
            activeTab={status}
            onChange={setStatus}
            tabs={[
              { id: "all", label: "All Alerts", count: alerts.length },
              { id: "new", label: "New", count: alerts.filter((a) => lc(a.status) === "new").length },
              { id: "acked", label: "Acknowledged", count: alerts.filter((a) => lc(a.status) === "acked").length },
              { id: "resolved", label: "Resolved", count: alerts.filter((a) => lc(a.status) === "resolved").length },
            ]}
          />

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Kind:</span>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value)}
              className="h-8 rounded-lg border border-input bg-card px-2.5 text-xs text-foreground focus-visible:outline-none"
            >
              <option value="all">All Kinds</option>
              <option value="auto">Automated Model</option>
              <option value="manual">Manual Broadcast</option>
            </select>
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={refresh}>
          Refresh Ledger
        </Button>
      </Card>

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-xs font-medium text-destructive">
          <AlertTriangle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Alert Ledger Table */}
      <Card>
        <CardHeader className="pb-3 border-b border-border/60">
          <CardTitle>Active Incident Ledger</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Classification</TableHead>
                <TableHead>Sentinel LGU</TableHead>
                <TableHead>Disease Vector</TableHead>
                <TableHead>Alert Directives / Message</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRowSkeleton columns={6} rows={6} />
              ) : filtered.length === 0 ? (
                <TableEmpty colSpan={6} message="No alerts match the selected triage filter." />
              ) : (
                filtered.map((a) => {
                  const isNew = lc(a.status) === "new";
                  return (
                    <TableRow
                      key={a.id}
                      className={isNew ? "bg-destructive/5 hover:bg-destructive/10" : ""}
                    >
                      <TableCell>{kindBadge(a.kind)}</TableCell>
                      <TableCell className="font-bold text-foreground">{a.muni}</TableCell>
                      <TableCell>
                        <span className="font-semibold text-foreground capitalize">{a.disease}</span>
                      </TableCell>
                      <TableCell className="max-w-md text-foreground">
                        <div className="space-y-0.5">
                          <p className="text-xs leading-relaxed">{a.message}</p>
                          {a.playbookCode && (
                            <span className="text-[10px] font-mono text-muted-foreground">
                              Ref: {a.playbookCode}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{statusBadge(a.status)}</TableCell>
                      <TableCell className="text-right">
                        {isNew ? (
                          <Button
                            variant="outline"
                            size="sm"
                            icon={<Check size={13} />}
                            onClick={() => handleAck(a.id)}
                          >
                            Acknowledge
                          </Button>
                        ) : (
                          <span className="text-[11px] text-muted-foreground font-medium">Logged</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Broadcast Alert Dialog Modal */}
      <Dialog
        open={broadcastOpen}
        onClose={() => setBroadcastOpen(false)}
        title="Broadcast Municipal Emergency Alert"
        description="Dispatch SMS broadcast and telemetry webhook to local health units and BHW officers."
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setBroadcastOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleSend}
              loading={sending}
              disabled={!message.trim()}
            >
              Dispatch Broadcast
            </Button>
          </>
        }
      >
        <div className="space-y-3.5">
          <div>
            <label className="text-xs font-bold text-muted-foreground block mb-1">
              Target Municipality / LGU
            </label>
            <Select value={muni} onChange={(e) => setMuni(e.target.value)}>
              {MUNIS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="text-xs font-bold text-muted-foreground block mb-1">
              Alert Directives / Message Content *
            </label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. Cluster of 14 acute fever cases identified. Initiate search-and-destroy cleanup and setup dedicated triage lane."
              className="w-full rounded-lg border border-input bg-card p-2.5 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-muted-foreground block mb-1">
              Clinical SOP Playbook Code (Optional)
            </label>
            <Input
              value={playbookCode}
              onChange={(e) => setPlaybookCode(e.target.value)}
              placeholder="e.g. SOP-VEC-01"
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}
