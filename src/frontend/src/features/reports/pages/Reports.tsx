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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-medium text-blue-600 dark:text-blue-400">
              <FileBarChart size={13} strokeWidth={2.2} />
              DOH Epidemiological Surveillance Reports
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Surveillance Bulletins & Reporting
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Automated Weekly Epidemiological Surveillance Report (WESR) compliant with DOH EB & RA 11332 standards.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleDownload("PDF")}
            disabled={downloading}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs disabled:opacity-50"
          >
            <Download size={14} strokeWidth={2.2} />
            <span>{downloading ? "Compiling..." : "Export WESR (PDF)"}</span>
          </button>
          <button
            onClick={() => handleDownload("CSV")}
            disabled={downloading}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            <Table size={14} strokeWidth={2.2} />
            <span>Export Linelist (CSV)</span>
          </button>
        </div>
      </div>

      {downloaded && (
        <div className="flex items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
          <CheckCircle2 size={16} strokeWidth={2.2} className="shrink-0" />
          <span>Official Epidemiological Bulletin generated successfully. File downloaded to local system.</span>
        </div>
      )}

      {/* Executive Briefing Summary Card */}
      <div className="rounded-xl border border-border border-l-4 border-l-blue-500 bg-card p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <FileText size={16} strokeWidth={2.2} className="text-blue-500" />
          <h3 className="text-sm font-semibold text-foreground">
            Executive Surveillance Brief — Epi Week 40
          </h3>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          <strong className="text-foreground">Summary for Municipal Health Board:</strong> A statistically significant increase in Dengue
          cases (+54.8% week-over-week) was observed across 3 barangays, driven by recent continuous precipitation
          and standing water pooling. Prepositioning of ORS and Doxycycline is 92% complete across RHU sentinel stations.
        </p>
        <div className="flex flex-wrap gap-4 pt-1 text-[11px] text-muted-foreground border-t border-border/50">
          <span><strong className="text-foreground">Period:</strong> Epi Week 40 (Oct 1–7)</span>
          <span><strong className="text-foreground">Reporting RHU:</strong> San Fernando Main Sentinel</span>
          <span><strong className="text-foreground">Surveillance Officer:</strong> Dr. M. Santos (MHO)</span>
        </div>
      </div>

      {/* Morbidity & Mortality Table */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 py-4 border-b border-border bg-muted/40">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Weekly Morbidity & Outbreak Threshold Indicators
            </h3>
            <p className="text-xs text-muted-foreground">
              Sentinel disease incidence comparison against historic 5-year epidemic thresholds.
            </p>
          </div>
          <span className="inline-flex items-center rounded-md bg-muted px-2.5 py-1 text-[11px] font-mono text-muted-foreground">
            Official DOH Registry
          </span>
        </div>

        <div className="p-5">
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-muted/40 text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-4 py-3 font-semibold uppercase tracking-wider">Monitored Syndrome / Disease</th>
                  <th className="px-4 py-3 font-semibold uppercase tracking-wider">Epi W40 Cases</th>
                  <th className="px-4 py-3 font-semibold uppercase tracking-wider">Epi W39 Cases</th>
                  <th className="px-4 py-3 font-semibold uppercase tracking-wider">Attack Rate</th>
                  <th className="px-4 py-3 font-semibold uppercase tracking-wider">CFR</th>
                  <th className="px-4 py-3 font-semibold uppercase tracking-wider text-right">Threshold Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {REPORT_DATA.map((r, i) => (
                  <tr key={i} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground text-[13px]">
                      {r.disease}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-sm">
                      <span className={r.casesThisWeek > r.casesLastWeek ? "text-rose-600 dark:text-rose-400" : "text-foreground"}>
                        {r.casesThisWeek}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-muted-foreground">
                      {r.casesLastWeek}
                    </td>
                    <td className="px-4 py-3 font-mono text-muted-foreground">
                      {r.attackRate}
                    </td>
                    <td className="px-4 py-3 font-mono text-muted-foreground">
                      {r.cfr}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {r.thresholdStatus === "Alert" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-rose-500/10 px-2.5 py-1 text-[11px] font-medium text-rose-600 dark:text-rose-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                          Alert Threshold
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                          Normal Baseline
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
