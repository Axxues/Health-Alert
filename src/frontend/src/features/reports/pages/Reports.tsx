import { useState } from "react";
import {
  FileBarChart,
  Download,
  CheckCircle2,
  FileText,
  Table,
} from "lucide-react";

interface ReportRow {
  disease: string;
  casesThisWeek: number;
  casesLastWeek: number;
  attackRate: string;
  cfr: string;
  thresholdStatus: "Normal" | "Alert" | "Epidemic";
}

const REPORT_DATA: ReportRow[] = [
  { disease: "Dengue Clinical (Suspected + Confirmed)", casesThisWeek: 48, casesLastWeek: 31, attackRate: "18.4 / 100k", cfr: "0.0%", thresholdStatus: "Alert" },
  { disease: "Leptospirosis (Post-Flood Exposure)", casesThisWeek: 9, casesLastWeek: 4, attackRate: "3.5 / 100k", cfr: "0.0%", thresholdStatus: "Alert" },
  { disease: "Influenza-like Illness (ILI)", casesThisWeek: 112, casesLastWeek: 108, attackRate: "43.1 / 100k", cfr: "0.0%", thresholdStatus: "Normal" },
  { disease: "Bronchial Asthma & Acute Dyspnea", casesThisWeek: 34, casesLastWeek: 29, attackRate: "13.1 / 100k", cfr: "0.0%", thresholdStatus: "Normal" },
];

export function Reports() {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  function handleDownload(_format: string) {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 3000);
    }, 1200);
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      {/* Header */}
      <div className="dash-head" style={{ margin: "0 0 4px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span className="pill pill--primary" style={{ fontSize: "11px" }}>
              <FileBarChart size={13} strokeWidth={2.2} />
              DOH Epidemiological Surveillance Reports
            </span>
          </div>
          <h1>Surveillance Bulletins & Reporting</h1>
          <p className="sub">
            Automated Weekly Epidemiological Surveillance Report (WESR) compliant with DOH EB & RA 11332 data standards.
          </p>
        </div>

        <div className="dash-actions">
          <button className="btn-pill" onClick={() => handleDownload("PDF")} disabled={downloading}>
            <Download size={15} strokeWidth={2.2} />
            <span>{downloading ? "Compiling PDF..." : "Export WESR Bulletin (PDF)"}</span>
          </button>
          <button className="btn-pill btn-pill--ghost" onClick={() => handleDownload("CSV")} disabled={downloading}>
            <Table size={15} strokeWidth={2.2} />
            <span>Export Linelist (CSV)</span>
          </button>
        </div>
      </div>

      {downloaded && (
        <div
          className="card anim"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "var(--green-bg)",
            borderColor: "var(--green-border)",
            color: "var(--green)",
            padding: "12px 18px",
          }}
        >
          <CheckCircle2 size={18} strokeWidth={2.2} />
          <span style={{ fontWeight: 600, fontSize: "13.5px" }}>
            Official Epidemiological Bulletin generated successfully. File downloaded to local system.
          </span>
        </div>
      )}

      {/* Executive Briefing Summary */}
      <div className="card" style={{ borderLeft: "4px solid var(--primary)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <FileText size={17} strokeWidth={2.2} style={{ color: "var(--primary)" }} />
          <h3 style={{ margin: 0, fontSize: 16 }}>Executive Surveillance Brief — Epi Week 40</h3>
        </div>
        <p style={{ margin: "0 0 12px", fontSize: "14px", lineHeight: 1.6, color: "var(--ink)" }}>
          <b>Summary for Municipal Mayor & Local Health Board:</b> A statistically significant increase in Dengue
          cases (+54.8% week-over-week) was observed across 3 barangays, driven by recent continuous precipitation
          and standing water pooling. Prepositioning of ORS and Doxycycline is 92% complete across RHU sentinel stations.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: "12.5px", color: "var(--mute)" }}>
          <span><b>Period:</b> Epi Week 40 (Oct 1–7)</span>
          <span><b>Reporting RHU:</b> San Fernando Main Sentinel Unit</span>
          <span><b>Surveillance Officer:</b> Dr. M. Santos (MHO)</span>
        </div>
      </div>

      {/* Morbidity & Mortality Table */}
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16 }}>Weekly Morbidity & Outbreak Threshold Indicators</h3>
            <p className="sub">Sentinel disease incidence comparison against historic 5-year epidemic thresholds.</p>
          </div>
          <span className="pill pill--primary">Official DOH Registry</span>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Monitored Syndrome / Disease</th>
                <th>Epi Week 40 Cases</th>
                <th>Epi Week 39 Cases</th>
                <th>Incidence / Attack Rate</th>
                <th>Case Fatality (CFR)</th>
                <th style={{ textAlign: "right" }}>Threshold Status</th>
              </tr>
            </thead>
            <tbody className="tabular">
              {REPORT_DATA.map((r, i) => (
                <tr key={i}>
                  <td>
                    <div style={{ fontWeight: 600, color: "var(--ink)" }}>{r.disease}</div>
                  </td>
                  <td>
                    <b style={{ fontSize: "15px", color: r.casesThisWeek > r.casesLastWeek ? "var(--red)" : "var(--ink)" }}>
                      {r.casesThisWeek}
                    </b>
                  </td>
                  <td style={{ color: "var(--mute)" }}>{r.casesLastWeek}</td>
                  <td>{r.attackRate}</td>
                  <td>{r.cfr}</td>
                  <td style={{ textAlign: "right" }}>
                    {r.thresholdStatus === "Alert" ? (
                      <span className="pill pill--bad">
                        <span className="dot dot--pulse" />
                        Alert Threshold
                      </span>
                    ) : (
                      <span className="pill pill--ok">Normal Baseline</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
