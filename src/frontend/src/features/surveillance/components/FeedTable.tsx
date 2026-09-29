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
      <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--mute)" }}>
        No surveillance data feeds configured in this health registry.
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Surveillance Feed Source</th>
            <th>System Code</th>
            <th>Domain Category</th>
            <th>Ingestion Cadence</th>
            <th>Telemetry Protocol</th>
            <th>Pipeline Health</th>
          </tr>
        </thead>
        <tbody className="tabular">
          {feeds.map((f) => {
            const lowerCode = f.code.toLowerCase();
            const metaKey = Object.keys(FEED_META).find((k) => lowerCode.includes(k)) || "edcs";
            const meta = FEED_META[metaKey];

            return (
              <tr key={f.id}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div className="glyph" style={{ width: 32, height: 32, borderRadius: 8 }}>
                      <Database size={15} strokeWidth={2.2} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: "var(--ink)" }}>{f.name}</div>
                      <div style={{ fontSize: "11.5px", color: "var(--mute)" }}>ID #{f.id} · DOH / LGU Sentinel</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="kbd" style={{ fontSize: "12px", letterSpacing: "0.02em" }}>
                    {f.code}
                  </span>
                </td>
                <td style={{ color: "var(--ink-secondary)" }}>
                  {meta.category}
                </td>
                <td style={{ color: "var(--mute)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <RefreshCw size={12} strokeWidth={2.2} />
                    <span>{meta.cadence}</span>
                  </div>
                </td>
                <td>
                  <span style={{ fontSize: "12px", color: "var(--mute)" }}>{meta.format}</span>
                </td>
                <td>
                  <span className="pill pill--ok" style={{ fontSize: "11.5px" }}>
                    <span className="dot dot--pulse" />
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
