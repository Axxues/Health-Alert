import { useEffect, useState } from "react";
import {
  FileText,
  Printer,
  Download,
  AlertTriangle,
  Flame,
  Bell,
  RefreshCw,
  FileSpreadsheet,
} from "lucide-react";
import { bulletin, exportRows } from "@/services/reports/api/reports.api";
import type { WeeklyBulletin } from "@/services/reports/types/reports.types";
import {
  Button,
  Card,
  CardTitle,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
  Input,
  Select,
  Tabs,
  PageHeader,
  Skeleton,
} from "@/components/ui";

const MUNIS = ["San Fernando City", "Agoo", "Bauang", "Bacnotan", "San Juan"];
const DISEASES = [
  { id: "all", label: "All Diseases" },
  { id: "dengue", label: "Dengue" },
  { id: "leptospirosis", label: "Leptospirosis" },
  { id: "ili", label: "Flu-like (ILI)" },
  { id: "asthma", label: "Bronchial Asthma" },
];

function currentMonday(): string {
  const d = new Date();
  const diff = (d.getDay() - 1 + 7) % 7;
  d.setDate(d.getDate() - diff);
  return d.toISOString().slice(0, 10);
}

type ReportTab = "bulletin" | "custom";

export function Reports() {
  const [tab, setTab] = useState<ReportTab>("bulletin");
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

  const fetchBulletin = () => {
    setLoading(true);
    setError("");
    bulletin(week)
      .then(setData)
      .catch(() => setError("Failed to retrieve weekly epidemiological bulletin."))
      .finally(() => setLoading(false));
  };

  useEffect(fetchBulletin, [week]);

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
      a.download = `pidsr-cases-${from}_${to}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Epidemiological Reports & Bulletins"
        description="Weekly Philippine Integrated Disease Surveillance and Response (PIDSR) official bulletin generation and custom case linelist data exports."
        badge={
          <Badge variant="primary">
            Region I Epidemiology Bureau
          </Badge>
        }
        actions={
          <Tabs<ReportTab>
            activeTab={tab}
            onChange={setTab}
            tabs={[
              { id: "bulletin", label: "Weekly PIDSR Bulletin", icon: <FileText size={14} /> },
              { id: "custom", label: "Custom Linelist Export", icon: <FileSpreadsheet size={14} /> },
            ]}
          />
        }
      />

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-xs font-medium text-destructive">
          <AlertTriangle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* View 1: Weekly Bulletin */}
      {tab === "bulletin" && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <Card className="p-3.5 flex items-center justify-between gap-3 flex-wrap bg-card shadow-xs">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Surveillance Week:
              </span>
              <Input
                type="date"
                value={week}
                onChange={(e) => setWeek(e.target.value)}
                className="w-40"
              />
              <Button variant="outline" size="sm" onClick={fetchBulletin} icon={<RefreshCw size={12} />}>
                Refresh
              </Button>
            </div>

            <Button
              variant="primary"
              size="sm"
              icon={<Printer size={14} />}
              onClick={() => window.print()}
            >
              Print / Save PDF
            </Button>
          </Card>

          {/* Bulletin Print Preview */}
          {loading ? (
            <Card className="p-8 space-y-4">
              <Skeleton className="h-10 w-2/3" />
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-24 w-full" />
            </Card>
          ) : (
            <Card className="p-8 space-y-6 bg-card border-border shadow-sm print:border-none print:shadow-none">
              {/* Regional Header */}
              <div className="border-b border-border/80 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="primary">Official DOH / LGU Surveillance Document</Badge>
                    <span className="text-xs text-muted-foreground">Form PIDSR-W7</span>
                  </div>
                  <h2 className="text-xl font-extrabold tracking-tight text-foreground">
                    Weekly Epidemiological Bulletin
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Epidemiological surveillance summary for the week beginning <span className="font-semibold text-foreground">{data?.week}</span>
                  </p>
                </div>
                <div className="text-left sm:text-right text-[11px] text-muted-foreground font-mono">
                  <div>Region I Health Office</div>
                  <div>Report Generated: {generatedAt}</div>
                </div>
              </div>

              {/* Disease Incidence Table */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Disease Incidence Summary
                </h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Disease Category</TableHead>
                      <TableHead className="text-right">Observed Cases</TableHead>
                      <TableHead className="text-right">Previous Week</TableHead>
                      <TableHead className="text-right">Weekly Delta %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data?.diseases ?? []).length === 0 ? (
                      <TableEmpty colSpan={4} message="No disease incident rows reported for this week." />
                    ) : (
                      (data?.diseases ?? []).map((d) => (
                        <TableRow key={d.disease}>
                          <TableCell className="font-bold text-foreground capitalize">{d.disease}</TableCell>
                          <TableCell className="text-right font-mono font-bold tabular-nums text-foreground">
                            {d.cases}
                          </TableCell>
                          <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                            {d.prevCases}
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold tabular-nums">
                            <span
                              className={
                                d.changePct > 0
                                  ? "text-rose-600 dark:text-rose-400"
                                  : d.changePct < 0
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-muted-foreground"
                              }
                            >
                              {d.changePct > 0 ? `+${d.changePct.toFixed(1)}%` : `${d.changePct.toFixed(1)}%`}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Hotspots & Active Alerts Dual Block */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 pt-2">
                <Card className="p-4 bg-muted/20 border-border/60">
                  <div className="flex items-center gap-2 mb-2 font-bold text-xs text-foreground">
                    <Flame size={14} className="text-destructive" />
                    <span>Identified Outbreak Clusters & Hotspots</span>
                  </div>
                  {(data?.hotspots ?? []).length === 0 ? (
                    <p className="text-xs text-muted-foreground">No critical transmission hotspots detected this week.</p>
                  ) : (
                    <ul className="space-y-1.5 text-xs text-foreground list-disc list-inside">
                      {data?.hotspots.map((h) => (
                        <li key={h} className="font-medium">
                          {h}
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>

                <Card className="p-4 bg-muted/20 border-border/60">
                  <div className="flex items-center gap-2 mb-2 font-bold text-xs text-foreground">
                    <Bell size={14} className="text-amber-500" />
                    <span>Active Municipal Advisories</span>
                  </div>
                  {(data?.activeAlerts ?? []).length === 0 ? (
                    <p className="text-xs text-muted-foreground">No active municipal alerts for this period.</p>
                  ) : (
                    <ul className="space-y-1.5 text-xs text-foreground list-disc list-inside">
                      {data?.activeAlerts.map((a, i) => (
                        <li key={i} className="font-medium">
                          {a}
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              </div>

              <div className="pt-4 border-t border-border/60 text-[11px] text-muted-foreground flex justify-between">
                <span>Certified by: Regional Epidemiology & Surveillance Unit (RESU)</span>
                <span>System: Health Alert / BantayHealthAI</span>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* View 2: Custom Linelist Export */}
      {tab === "custom" && (
        <div className="space-y-6">
          <Card className="p-6 space-y-5 max-w-2xl bg-card shadow-sm">
            <div className="space-y-1 border-b border-border/60 pb-3">
              <CardTitle>Custom Epidemiological Case Export</CardTitle>
              <p className="text-xs text-muted-foreground">
                Query raw syndromic and laboratory-confirmed linelist entries for regional analysis or external reporting.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">
                  Municipality / Sentinel Area
                </label>
                <Select value={muni} onChange={(e) => setMuni(e.target.value)}>
                  <option value="all">All Municipalities (Full Region)</option>
                  {MUNIS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">
                  Disease Vector Filter
                </label>
                <Select value={disease} onChange={(e) => setDisease(e.target.value)}>
                  {DISEASES.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">
                  Start Date (From)
                </label>
                <Input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">
                  End Date (To)
                </label>
                <Input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                />
              </div>
            </div>

            <div className="pt-3 border-t border-border/60 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Output format: <span className="font-mono font-bold text-foreground">Comma-Separated Values (.csv)</span>
              </span>
              <Button
                variant="primary"
                size="md"
                onClick={handleDownload}
                loading={downloading}
                icon={<Download size={14} />}
              >
                Export Linelist CSV
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
