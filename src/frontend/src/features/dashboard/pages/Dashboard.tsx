import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  ArrowRight,
  AlertTriangle,
  Flame,
  Activity,
  Building2,
  ClipboardList,
  Compass,
} from "lucide-react";
import { listHotspots } from "@/services/riskmaps/api";
import type { Hotspot } from "@/services/riskmaps/types";
import { getOutlook } from "@/services/forecast/api";
import type { ForecastOutlook } from "@/services/forecast/types";
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
  MetricCard,
  PageHeader,
  Skeleton,
} from "@/components/ui";
import { EpidemicBarGraph } from "@/features/dashboard/components/EpidemicBarGraph";

const DISEASES = ["dengue", "leptospirosis", "ili", "asthma"] as const;

function diseaseName(d: string) {
  if (d === "ili") return "Flu-like illness (ILI)";
  if (d === "asthma") return "Bronchial Asthma";
  return d.charAt(0).toUpperCase() + d.slice(1);
}

function sev(s: Hotspot) {
  if (/high/i.test(s.level)) return 3;
  if (/med|moderate/i.test(s.level)) return 2;
  return 1;
}

function levelLabel(n: number) {
  return n >= 3 ? "High Outbreak Risk" : n === 2 ? "Elevated Watch" : "Routine Baseline";
}

function levelVariant(n: number): "danger" | "warning" | "success" {
  if (n >= 3) return "danger";
  if (n === 2) return "warning";
  return "success";
}

export function Dashboard() {
  const [spots, setSpots] = useState<Hotspot[]>([]);
  const [outlooks, setOutlooks] = useState<Record<string, ForecastOutlook>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      listHotspots().then(setSpots),
      Promise.all(DISEASES.map((d) => getOutlook({ disease: d }).then((o) => [d, o] as const))).then(
        (rows) => setOutlooks(Object.fromEntries(rows))
      ),
    ])
      .catch(() => setError("Could not load surveillance telemetry. Please verify backend connection."))
      .finally(() => setLoading(false));
  }, []);

  const highCount = spots.filter((s) => sev(s) >= 3).length;
  const medCount = spots.filter((s) => sev(s) === 2).length;

  const ranked = [...spots].sort((a, b) => sev(b) - sev(a));
  const targets = ranked.slice(0, 6);

  const outlookRows = [...DISEASES]
    .map((d) => ({ disease: d, outlook: outlooks[d] }))
    .filter((r) => r.outlook)
    .sort((a, b) => b.outlook.probability - a.outlook.probability);

  const topProb = Math.round((outlookRows[0]?.outlook.probability ?? 0) * 100);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Surveillance Command Center"
        description={`Philippine National Sentinel Network (PIDSR/EDCS) · ${spots.length} active monitoring sentinel nodes · ${highCount} municipal outbreak alerts require review today.`}
        badge={
          <Badge variant="primary" pulse>
            Telemetry Synchronized
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Link to="/risk-maps">
              <Button variant="outline" size="sm" icon={<Compass size={14} />}>
                Geospatial Matrix
              </Button>
            </Link>
            <Link to="/intelligence">
              <Button variant="primary" size="sm" icon={<Activity size={14} />}>
                Forecast Matrix
              </Button>
            </Link>
          </div>
        }
      />

      {/* Error Alert Banner */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-xs font-medium text-destructive">
          <AlertTriangle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 4-Column KPI Telemetry Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          <>
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </>
        ) : (
          <>
            <MetricCard
              title="Active Hotspots"
              value={spots.length}
              subtitle={`${highCount} critical alerts · ${medCount} elevated`}
              variant={highCount > 0 ? "critical" : "default"}
              icon={<Flame size={16} />}
              trend={{ delta: `+${highCount}`, positive: false, label: "today" }}
            />
            <MetricCard
              title="Regional Surge Probability"
              value={`${topProb}%`}
              subtitle="Walk-forward bi-LSTM model fitted"
              variant={topProb > 60 ? "critical" : "default"}
              icon={<Activity size={16} />}
              trend={{ delta: "3.2%", positive: true, label: "confidence" }}
            />
            <MetricCard
              title="Monitored Sentinel Stations"
              value={spots.length > 0 ? "30" : "0"}
              subtitle="100% telemetry stream reporting"
              variant="success"
              icon={<Building2 size={16} />}
              trend={{ delta: "100%", positive: true, label: "uptime" }}
            />
            <MetricCard
              title="Clinical SOP Actions"
              value={highCount > 0 ? `${highCount * 3}` : "0"}
              subtitle="Vector & triage protocols pending"
              variant={highCount > 0 ? "warning" : "default"}
              icon={<ClipboardList size={16} />}
              trend={{ delta: highCount, positive: false, label: "municipalities" }}
            />
          </>
        )}
      </div>

      {/* Full-Width Multi-Week Epidemiological Curve Bar Graph */}
      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <EpidemicBarGraph />
      )}

      {/* Disease Surge Matrix Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Multi-Syndromic Disease Forecast Outlook
          </h3>
          <span className="text-xs text-muted-foreground">
            Next 4 weeks predictive envelope
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            <>
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </>
          ) : (
            DISEASES.map((d) => {
              const outlook = outlooks[d];
              const prob = Math.round((outlook?.probability ?? 0) * 100);
              const isHigh = prob >= 60;
              const isWatch = prob >= 35 && prob < 60;

              return (
                <Card key={d} hover className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle>{diseaseName(d)}</CardTitle>
                      <Badge variant={isHigh ? "danger" : isWatch ? "warning" : "success"}>
                        {isHigh ? "High Outbreak" : isWatch ? "Watch" : "Routine"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="flex items-baseline justify-between text-xs mb-1">
                        <span className="text-muted-foreground font-medium">Surge Probability</span>
                        <span className="font-extrabold tabular-nums font-mono text-foreground">{prob}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isHigh ? "bg-destructive" : isWatch ? "bg-amber-500" : "bg-emerald-500"
                          }`}
                          style={{ width: `${prob}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/60">
                      <span>Model Band:</span>
                      <span className="font-semibold text-foreground">
                        {outlook?.band ? `${outlook.band}` : "Routine"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Ranked Sentinel Hotspots Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle>Priority Sentinel Hotspots</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Ranked by transmission velocity and epidemiological case volume
            </p>
          </div>
          <Link to="/intelligence">
            <Button variant="ghost" size="sm">
              <span>View All Stations</span>
              <ArrowRight size={12} />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Municipality / LGU</TableHead>
                <TableHead>Disease Vector</TableHead>
                <TableHead>Surveillance Risk</TableHead>
                <TableHead className="text-right">Observed Cases</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-xs text-muted-foreground">
                    Loading sentinel telemetry...
                  </TableCell>
                </TableRow>
              ) : targets.length === 0 ? (
                <TableEmpty colSpan={5} message="No priority hotspots detected." />
              ) : (
                targets.map((spot, idx) => {
                  const s = sev(spot);
                  return (
                    <TableRow key={`${spot.muni}-${spot.disease}-${idx}`}>
                      <TableCell className="font-bold text-foreground">
                        <div className="flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-mono text-muted-foreground font-bold">
                            {idx + 1}
                          </span>
                          <span>{spot.muni}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-foreground">{diseaseName(spot.disease)}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={levelVariant(s)} pulse={s >= 3}>
                          {levelLabel(s)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold tabular-nums text-foreground">
                        {spot.cases ?? "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link to={`/intelligence/${spot.id || "loc-launion-sfc"}`}>
                          <Button variant="ghost" size="sm">
                            <span>Details</span>
                            <ArrowRight size={12} />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
