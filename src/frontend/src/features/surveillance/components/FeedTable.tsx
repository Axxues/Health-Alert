import { Database, RefreshCw } from "lucide-react";
import type { SurveillanceFeed } from "@/services/surveillance/types";

const FEED_META: Record<string, { category: string; cadence: string; format: string }> = {
  edcs: { category: "Clinical & Hospital Records", cadence: "Realtime (Event-driven)", format: "HL7 / JSON" },
  pagasa: { category: "Meteorological Covariates", cadence: "Every 3 Hours", format: "PAGASA REST API" },
  trends: { category: "Search & Social Syndromic", cadence: "Hourly Batch", format: "JSON Micro-batch" },
  water: { category: "Environmental & Runoff", cadence: "Daily Sensor Stream", format: "MQTT / Telemetry" },
  clinic: { category: "RHU Outpatient Log", cadence: "Twice Daily", format: "EDCS-IS Sync" },
};

export function FeedTable({ feeds }: { feeds: SurveillanceFeed[] }) {
  if (feeds.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-muted-foreground">
        No surveillance data feeds configured in this health registry.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-xs text-left border-collapse">
        <thead className="bg-muted/40 text-muted-foreground border-b border-border">
          <tr>
            <th className="px-4 py-3 font-semibold uppercase tracking-wider">Surveillance Feed Source</th>
            <th className="px-4 py-3 font-semibold uppercase tracking-wider">System Code</th>
            <th className="px-4 py-3 font-semibold uppercase tracking-wider">Domain Category</th>
            <th className="px-4 py-3 font-semibold uppercase tracking-wider">Ingestion Cadence</th>
            <th className="px-4 py-3 font-semibold uppercase tracking-wider">Telemetry Protocol</th>
            <th className="px-4 py-3 font-semibold uppercase tracking-wider">Pipeline Health</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {feeds.map((f) => {
            const lowerCode = f.code.toLowerCase();
            const metaKey = Object.keys(FEED_META).find((k) => lowerCode.includes(k)) || "edcs";
            const meta = FEED_META[metaKey];

            return (
              <tr key={f.id} className="transition-colors hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Database size={15} strokeWidth={2} />
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">{f.name}</div>
                      <div className="text-[11px] text-muted-foreground">ID #{f.id} · DOH / LGU Sentinel</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded bg-muted text-[11px] font-semibold border border-border">
                    {f.code}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground font-medium">
                  {meta.category}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <RefreshCw size={12} strokeWidth={2} />
                    <span>{meta.cadence}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground font-medium">
                  {meta.format}
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[11px] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live Active
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
