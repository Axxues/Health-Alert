import { Bell, CheckCheck, ShieldCheck } from "lucide-react";
import type { HealthAlert } from "@/services/alerts/types";

export function AlertTable({
  items,
  onAck,
}: {
  items: HealthAlert[];
  onAck: (id: number) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="py-12 text-center text-xs text-muted-foreground">
        <ShieldCheck size={36} strokeWidth={1.8} className="text-emerald-500 mx-auto mb-2" />
        <div className="text-sm font-bold text-foreground">All Surveillance Clear</div>
        <p className="m-0 text-xs text-muted-foreground mt-1">
          No unacknowledged outbreak alerts or syndromic anomalies detected.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-xs text-left border-collapse">
        <thead className="bg-muted/40 text-muted-foreground border-b border-border">
          <tr>
            <th className="px-4 py-3 font-semibold uppercase tracking-wider">Alert Details & Advisory</th>
            <th className="px-4 py-3 font-semibold uppercase tracking-wider">Syndrome / Code</th>
            <th className="px-4 py-3 font-semibold uppercase tracking-wider">Triage Status</th>
            <th className="px-4 py-3 font-semibold uppercase tracking-wider">Assigned Action</th>
            <th className="px-4 py-3 font-semibold uppercase tracking-wider text-right">Resolution</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {items.map((a) => {
            const isAcked = a.status === "acked";

            return (
              <tr key={a.id} className="transition-colors hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isAcked ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      <Bell size={16} strokeWidth={2} />
                    </div>
                    <div>
                      <div className="font-semibold text-foreground text-xs sm:text-sm">
                        {a.message}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Incident Alert #{a.id} · Local Epidemiological Unit
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono">
                  <span className="px-2 py-0.5 rounded bg-muted text-[11px] font-medium border border-border">
                    {a.diseaseId ? `DISEASE-${a.diseaseId}` : "SYNDROMIC-CLUSTER"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {isAcked ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-semibold">
                      <ShieldCheck size={12} strokeWidth={2.5} />
                      Acknowledged
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-destructive/10 text-destructive border border-destructive/20 text-[10px] font-bold uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-ping" />
                      Pending Action
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  Deploy BHW Field Team & Dispatch SMS
                </td>
                <td className="px-4 py-3 text-right">
                  {!isAcked ? (
                    <button
                      className="btn-pill text-xs px-3 py-1 gap-1"
                      onClick={() => onAck(a.id)}
                    >
                      <CheckCheck size={13} strokeWidth={2.2} />
                      <span>Acknowledge</span>
                    </button>
                  ) : (
                    <span className="text-xs text-muted-foreground">Resolved</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
