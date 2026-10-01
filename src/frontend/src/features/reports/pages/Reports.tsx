import { useEffect, useState } from "react";
import { bulletin, exportRows } from "@/services/reports/api/reports.api";
import type { WeeklyBulletin } from "@/services/reports/types/reports.types";

const MUNIS = ["San Fernando City", "Agoo", "Bauang", "Bacnotan", "San Juan"];
const DISEASES = ["dengue", "leptospirosis", "ili", "asthma"];

function currentMonday(): string {
  const d = new Date();
  const diff = (d.getDay() - 1 + 7) % 7;
  d.setDate(d.getDate() - diff);
  return d.toISOString().slice(0, 10);
}

type Tab = "bulletin" | "custom";

export function Reports() {
  const [tab, setTab] = useState<Tab>("bulletin");
  const [week, setWeek] = useState(currentMonday);
  const [data, setData] = useState<WeeklyBulletin | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generatedAt] = useState(() => new Date().toLocaleString());

  const [muni, setMuni] = useState("all");
  const [disease, setDisease] = useState("all");
  const [from, setFrom] = useState(currentMonday());
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError("");
    bulletin(week)
      .then(setData)
      .catch(() => setError("Failed to retrieve weekly bulletin."))
      .finally(() => setLoading(false));
  }, [week]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const rows = await exportRows(
        muni === "all" ? undefined : muni,
        disease === "all" ? undefined : disease,
        from || undefined,
        to || undefined
      );
      const csv = ["date,muni,disease,count", ...rows.map((r) => `${r.date},${r.muni},${r.disease},${r.count}`)].join("\n");
      const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `cases-${from}_${to}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  const selectClass =
    "bg-transparent border border-input rounded-md text-xs text-foreground focus:outline-none cursor-pointer px-2.5 py-2 shadow-xs";
  const inputClass =
    "bg-transparent border border-input rounded-md text-xs text-foreground focus:outline-none px-2.5 py-2 shadow-xs";

  return (
    <div className="page-doc" style={{ display: "grid", gap: 20 }}>
      <div>
        <h1 style={{ margin: "0 0 4px", fontSize: "24px", fontWeight: 800, letterSpacing: "-0.02em" }}>
          Reports
        </h1>
        <p style={{ margin: 0, fontSize: "13px", color: "var(--mute)" }}>
          Weekly epidemiological bulletin and custom case exports
        </p>
      </div>

      <div style={{ display: "flex", gap: 20, borderBottom: "1px solid var(--hairline)" }}>
        {(
          [
            { id: "bulletin", label: "Bulletin" },
            { id: "custom", label: "Custom export" },
          ] as { id: Tab; label: string }[]
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            style={{
              background: "none",
              border: "none",
              borderBottom: tab === t.id ? "2px solid var(--primary)" : "2px solid transparent",
              color: tab === t.id ? "var(--ink)" : "var(--mute)",
              fontSize: "13px",
              fontWeight: tab === t.id ? 700 : 500,
              padding: "0 2px 8px",
              marginBottom: -1,
              cursor: "pointer",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "bulletin" ? (
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <input type="date" value={week} onChange={(e) => setWeek(e.target.value)} className={inputClass} aria-label="Week" />
            <button type="button" className="btn-pill text-xs" onClick={() => window.print()}>
              Print
            </button>
          </div>
          {error ? (
            <p style={{ fontSize: "13px", color: "var(--red)" }}>{error}</p>
          ) : loading ? (
            <p style={{ padding: "32px 0", textAlign: "center", color: "var(--mute)", fontSize: "13px" }}>
              Loading weekly bulletin...
            </p>
          ) : (
            <div className="print-area" style={{ border: "1px solid var(--hairline)", borderRadius: 12, background: "var(--card)", padding: 24, display: "grid", gap: 16 }}>
              <div>
                <h2 style={{ margin: "0 0 4px", fontSize: "18px", fontWeight: 800 }}>Weekly epidemiological bulletin</h2>
                <p style={{ margin: 0, fontSize: "13px", color: "var(--mute)" }}>Week of {data?.week}</p>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--hairline)", background: "var(--muted)" }}>
                    {(["Disease", "Cases", "Prev", "Change %"] as const).map((h) => (
                      <th key={h} style={{ textAlign: "left", fontSize: "11.5px", fontWeight: 600, color: "var(--mute)", padding: "10px 16px", whiteSpace: "nowrap" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(data?.diseases ?? []).map((d) => (
                    <tr key={d.disease} style={{ borderBottom: "1px solid var(--hairline)" }}>
                      <td style={{ padding: "11px 16px", fontWeight: 700 }}>{d.disease}</td>
                      <td className="tabular" style={{ padding: "11px 16px" }}>{d.cases}</td>
                      <td className="tabular" style={{ padding: "11px 16px" }}>{d.prevCases}</td>
                      <td className="tabular" style={{ padding: "11px 16px", color: d.changePct > 0 ? "var(--red)" : "var(--green)" }}>
                        {d.changePct.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div>
                <h3 style={{ margin: "0 0 6px", fontSize: "14px", fontWeight: 700 }}>Hotspots</h3>
                {(data?.hotspots ?? []).length === 0 ? (
                  <p style={{ margin: 0, fontSize: "13px", color: "var(--mute)" }}>No hotspots this week.</p>
                ) : (
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: "13px" }}>
                    {data?.hotspots.map((h) => <li key={h}>{h}</li>)}
                  </ul>
                )}
              </div>
              <div>
                <h3 style={{ margin: "0 0 6px", fontSize: "14px", fontWeight: 700 }}>Active alerts</h3>
                {(data?.activeAlerts ?? []).length === 0 ? (
                  <p style={{ margin: 0, fontSize: "13px", color: "var(--mute)" }}>No active alerts.</p>
                ) : (
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: "13px" }}>
                    {data?.activeAlerts.map((a, i) => <li key={i}>{a}</li>)}
                  </ul>
                )}
              </div>
              <p style={{ margin: 0, fontSize: "12px", color: "var(--mute)" }}>Generated {generatedAt}</p>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <select value={muni} onChange={(e) => setMuni(e.target.value)} className={selectClass} aria-label="Municipality">
              <option value="all">All municipalities</option>
              {MUNIS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <select value={disease} onChange={(e) => setDisease(e.target.value)} className={selectClass} aria-label="Disease">
              <option value="all">All diseases</option>
              {DISEASES.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputClass} aria-label="From" />
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputClass} aria-label="To" />
            <button type="button" className="btn-pill text-xs" onClick={handleDownload} disabled={downloading}>
              {downloading ? "Preparing..." : "Download CSV"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
