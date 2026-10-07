import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  Search,
  AlertTriangle,
  X,
  Compass,
  Building2,
  TrendingUp,
  TrendingDown,
  Radio,
  LayoutGrid,
  List,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { listLocations } from "@/services/forecast/api/locations.api";
import type { LocationDiseaseEntry, LocationFilter } from "@/services/forecast/types/forecast.types";
import { listFeeds } from "@/services/surveillance/api";
import type { SurveillanceFeed } from "@/services/surveillance/types";
import { FeedTable } from "@/features/surveillance/components/FeedTable";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Input,
  Select,
  Tabs,
  PageHeader,
  Skeleton,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  TableEmpty,
  TableRowSkeleton,
} from "@/components/ui";

const PROVINCES = [
  "All Provinces",
  "La Union",
  "Pangasinan",
  "Ilocos Sur",
  "Ilocos Norte",
  "Benguet",
  "Metro Manila (NCR)",
  "Pampanga",
  "Bulacan",
  "Cavite",
  "Laguna",
  "Batangas",
  "Cebu",
];

const MUNICIPALITIES_BY_PROVINCE: Record<string, string[]> = {
  "La Union": ["All Municipalities", "San Fernando City", "Agoo", "Bauang", "Bacnotan", "Naguilian", "San Juan", "Rosario", "Santo Tomas"],
  "Pangasinan": ["All Municipalities", "Dagupan City", "San Carlos City", "Urdaneta City", "Lingayen", "Alaminos City", "Calasiao", "Mangaldan", "Binmaley"],
  "Ilocos Sur": ["All Municipalities", "Vigan City", "Candon City", "Narvacan", "Tagudin"],
  "Ilocos Norte": ["All Municipalities", "Laoag City", "Batac City", "San Nicolas", "Paoay", "Dingras"],  "Benguet": ["All Municipalities", "Baguio City", "La Trinidad"],
  "Metro Manila (NCR)": ["All Municipalities", "Quezon City", "City of Manila", "Caloocan City", "Pasig City"],
  "Pampanga": ["All Municipalities", "City of San Fernando", "Angeles City"],
  "Bulacan": ["All Municipalities", "Malolos City", "Meycauayan City"],
  "Cavite": ["All Municipalities", "Dasmariñas City", "Imus City", "Bacoor City"],
  "Laguna": ["All Municipalities", "Santa Rosa City", "Calamba City", "San Pedro City"],
  "Batangas": ["All Municipalities", "Batangas City", "Lipa City"],
  "Cebu": ["All Municipalities", "Cebu City", "Mandaue City", "Lapu-Lapu City"],
};

const DISEASES = [
  { id: "all", label: "All Diseases" },
  { id: "dengue", label: "Dengue" },
  { id: "leptospirosis", label: "Leptospirosis" },
  { id: "ili", label: "Flu-like (ILI)" },
  { id: "asthma", label: "Asthma" },
];

const RISK_LEVELS = [
  { id: "all", label: "Any Risk" },
  { id: "high", label: "High Risk" },
  { id: "moderate", label: "Elevated Watch" },
  { id: "low", label: "Routine Baseline" },
];

type TabType = "locations" | "pipelines";
type ViewMode = "cards" | "table";
type SortField =
  | "municipality"
  | "diseaseName"
  | "riskLevel"
  | "outbreakProbability"
  | "activeCases"
  | "changePercent";
type SortOrder = "asc" | "desc";

export function Intelligence() {
  const navigate = useNavigate();
  const [locations, setLocations] = useState<LocationDiseaseEntry[]>([]);
  const [feeds, setFeeds] = useState<SurveillanceFeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("locations");

  // View mode: Cards vs Table Ledger
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    try {
      const saved = localStorage.getItem("health_alert_intelligence_view_mode");
      return saved === "table" ? "table" : "cards";
    } catch {
      return "cards";
    }
  });

  // Sorting state for table and cards
  const [sortField, setSortField] = useState<SortField>("outbreakProbability");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("All Provinces");
  const [selectedMunicipality, setSelectedMunicipality] = useState("All Municipalities");
  const [selectedDisease, setSelectedDisease] = useState("all");
  const [selectedRisk, setSelectedRisk] = useState("all");

  useEffect(() => {
    listFeeds().then(setFeeds).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setError("");
    const filter: LocationFilter = {
      search: searchQuery || undefined,
      province: selectedProvince !== "All Provinces" ? selectedProvince : undefined,
      municipality: selectedMunicipality !== "All Municipalities" ? selectedMunicipality : undefined,
      disease: selectedDisease !== "all" ? selectedDisease : undefined,
      riskLevel: selectedRisk !== "all" ? selectedRisk : undefined,
    };
    listLocations(filter)
      .then(setLocations)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load sentinel locations."))
      .finally(() => setLoading(false));
  }, [searchQuery, selectedProvince, selectedMunicipality, selectedDisease, selectedRisk]);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    try {
      localStorage.setItem("health_alert_intelligence_view_mode", mode);
    } catch {}
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder(field === "municipality" || field === "diseaseName" ? "asc" : "desc");
    }
  };

  const sortedLocations = useMemo(() => {
    return [...locations].sort((a, b) => {
      let aVal: string | number = a[sortField];
      let bVal: string | number = b[sortField];

      if (sortField === "riskLevel") {
        const riskRank: Record<string, number> = { high: 3, moderate: 2, low: 1 };
        aVal = riskRank[a.riskLevel] || 0;
        bVal = riskRank[b.riskLevel] || 0;
      }

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortOrder === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }

      const numA = Number(aVal) || 0;
      const numB = Number(bVal) || 0;
      return sortOrder === "asc" ? numA - numB : numB - numA;
    });
  }, [locations, sortField, sortOrder]);

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown size={12} className="opacity-40" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUp size={12} className="text-primary" />
    ) : (
      <ArrowDown size={12} className="text-primary" />
    );
  };

  const hasActiveFilters =
    Boolean(searchQuery) ||
    selectedProvince !== "All Provinces" ||
    selectedMunicipality !== "All Municipalities" ||
    selectedDisease !== "all" ||
    selectedRisk !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedProvince("All Provinces");
    setSelectedMunicipality("All Municipalities");
    setSelectedDisease("all");
    setSelectedRisk("all");
  };

  const currentMunicipalities =
    selectedProvince !== "All Provinces" && MUNICIPALITIES_BY_PROVINCE[selectedProvince]
      ? MUNICIPALITIES_BY_PROVINCE[selectedProvince]
      : ["All Municipalities"];

  const riskBadge = (risk: string) => {
    if (risk === "high") {
      return (
        <Badge variant="danger" pulse>
          High Outbreak Risk
        </Badge>
      );
    }
    if (risk === "moderate") {
      return <Badge variant="warning">Elevated Watch</Badge>;
    }
    return <Badge variant="success">Routine Baseline</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Epidemiological Intelligence Matrix"
        description="Dynamic surveillance radar monitoring local transmission velocity, environmental covariates, and bi-LSTM predictive trajectories."
        badge={
          <Badge variant="primary">
            {locations.length} Sentinel Stations Monitored
          </Badge>
        }
        actions={
          <Tabs<TabType>
            activeTab={activeTab}
            onChange={setActiveTab}
            tabs={[
              { id: "locations", label: "Sentinel Stations", count: locations.length, icon: <Compass size={14} /> },
              { id: "pipelines", label: "Ingestion Feeds", count: feeds.length, icon: <Radio size={14} /> },
            ]}
          />
        }
      />

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-xs font-medium text-destructive">
          <AlertTriangle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tab: Sentinel Locations View */}
      {activeTab === "locations" && (
        <div className="space-y-4">
          {/* Filter Toolbar Card */}
          <Card className="p-4 space-y-3 bg-card shadow-xs">
            {/* Top row: search + location selectors */}
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
              <Input
                placeholder="Search municipality, station..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search size={14} />}
                className="w-full"
              />

              <Select
                value={selectedProvince}
                onChange={(e) => {
                  setSelectedProvince(e.target.value);
                  setSelectedMunicipality("All Municipalities");
                }}
              >
                {PROVINCES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </Select>

              <Select
                value={selectedMunicipality}
                onChange={(e) => setSelectedMunicipality(e.target.value)}
                disabled={selectedProvince === "All Provinces"}
              >
                {currentMunicipalities.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </Select>

              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="md"
                  onClick={clearFilters}
                  icon={<X size={14} />}
                  className="w-full text-muted-foreground hover:text-foreground"
                >
                  Reset Filters
                </Button>
              )}
            </div>

            {/* Bottom row: Disease & Risk filter pills */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/60">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mr-1">
                  Disease Vector:
                </span>
                {DISEASES.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setSelectedDisease(d.id)}
                    className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                      selectedDisease === d.id
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mr-1">
                  Surveillance Level:
                </span>
                {RISK_LEVELS.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedRisk(r.id)}
                    className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                      selectedRisk === r.id
                        ? "bg-foreground text-background shadow-xs"
                        : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Subheader: Results count & Card/Page view mode switcher */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-0.5">
            <div className="text-xs text-muted-foreground font-medium">
              Showing{" "}
              <span className="font-bold text-foreground font-mono tabular-nums">
                {sortedLocations.length}
              </span>{" "}
              sentinel stations
              {hasActiveFilters && " (filtered)"}
            </div>

            <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1 shadow-2xs">
              <button
                type="button"
                onClick={() => handleViewModeChange("cards")}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === "cards"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
                title="Cards Grid View"
              >
                <LayoutGrid size={13} />
                <span>Cards</span>
              </button>
              <button
                type="button"
                onClick={() => handleViewModeChange("table")}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === "table"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
                title="Table / Ledger Page View"
              >
                <List size={13} />
                <span>Table / Page</span>
              </button>
            </div>
          </div>

          {/* Sentinel Locations: Loading State */}
          {loading ? (
            viewMode === "cards" ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-44 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sentinel Location & Facility</TableHead>
                    <TableHead>Disease Vector</TableHead>
                    <TableHead>Surveillance Tier</TableHead>
                    <TableHead className="text-right">Surge Probability</TableHead>
                    <TableHead className="text-right">Active Cases</TableHead>
                    <TableHead className="text-right">Weekly Delta</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRowSkeleton columns={6} rows={6} />
                </TableBody>
              </Table>
            )
          ) : sortedLocations.length === 0 ? (
            <Card className="py-16 text-center text-xs text-muted-foreground">
              No sentinel locations match the selected filter criteria.
            </Card>
          ) : viewMode === "cards" ? (
            /* Cards Grid View */
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sortedLocations.map((loc) => {
                const isHigh = loc.riskLevel === "high";
                const prob = Math.round(loc.outbreakProbability * 100);

                return (
                  <Card
                    key={`${loc.id}-${loc.disease}`}
                    hover
                    className={`flex flex-col justify-between overflow-hidden cursor-pointer transition-all ${
                      isHigh ? "border-l-4 border-l-destructive" : ""
                    }`}
                    onClick={() => navigate(`/intelligence/${loc.id}`)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                            {loc.municipality}, {loc.province} · {loc.category}
                          </div>
                          <CardTitle className="text-base mt-0.5">{loc.barangay ? `Brgy. ${loc.barangay}` : loc.municipality}</CardTitle>
                        </div>
                        {riskBadge(loc.riskLevel)}
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3 pb-4">
                      <div className="flex items-baseline justify-between rounded-lg bg-muted/40 p-2.5 text-xs">
                        <div>
                          <span className="text-[11px] text-muted-foreground block">Vector Disease</span>
                          <span className="font-bold text-foreground">{loc.diseaseName}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] text-muted-foreground block">Surge Probability</span>
                          <span className="font-mono font-extrabold tabular-nums text-foreground">{prob}%</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[11px] text-muted-foreground block">Active Cases</span>
                          <span className="font-mono font-extrabold tabular-nums text-foreground">
                            {loc.activeCases}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] text-muted-foreground block">Weekly Delta</span>
                          <span
                            className={`inline-flex items-center font-mono font-semibold tabular-nums ${
                              loc.changePercent > 0
                                ? "text-rose-600 dark:text-rose-400"
                                : loc.changePercent < 0
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-muted-foreground"
                            }`}
                          >
                            {loc.changePercent > 0 ? (
                              <TrendingUp size={12} className="mr-0.5" />
                            ) : loc.changePercent < 0 ? (
                              <TrendingDown size={12} className="mr-0.5" />
                            ) : null}
                            {loc.changePercent > 0 ? `+${loc.changePercent}%` : `${loc.changePercent}%`}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-2 border-t border-border/60">
                        <Building2 size={13} className="shrink-0 text-muted-foreground" />
                        <span className="truncate">{loc.sentinelFacility || "Sentinel Health Unit"}</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            /* Table / Ledger Page View */
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer hover:text-foreground"
                    onClick={() => handleSort("municipality")}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Sentinel Location & Facility</span>
                      {renderSortIcon("municipality")}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:text-foreground"
                    onClick={() => handleSort("diseaseName")}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Disease Vector</span>
                      {renderSortIcon("diseaseName")}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:text-foreground"
                    onClick={() => handleSort("riskLevel")}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Surveillance Tier</span>
                      {renderSortIcon("riskLevel")}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:text-foreground text-right"
                    onClick={() => handleSort("outbreakProbability")}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Surge Probability</span>
                      {renderSortIcon("outbreakProbability")}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:text-foreground text-right"
                    onClick={() => handleSort("activeCases")}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Active Cases</span>
                      {renderSortIcon("activeCases")}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:text-foreground text-right"
                    onClick={() => handleSort("changePercent")}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Weekly Delta</span>
                      {renderSortIcon("changePercent")}
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedLocations.length === 0 ? (
                  <TableEmpty colSpan={6} message="No sentinel locations match the selected criteria." />
                ) : (
                  sortedLocations.map((loc) => {
                    const isHigh = loc.riskLevel === "high";
                    const prob = Math.round(loc.outbreakProbability * 100);

                    return (
                      <TableRow
                        key={`${loc.id}-${loc.disease}`}
                        className="hover:bg-muted/40 cursor-pointer"
                        onClick={() => navigate(`/intelligence/${loc.id}`)}
                      >
                        <TableCell>
                          <div>
                            <div className="font-bold text-foreground text-sm flex items-center gap-2">
                              {loc.barangay ? `Brgy. ${loc.barangay}` : loc.municipality}
                              {isHigh && (
                                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                              )}
                            </div>
                            <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                              <span>
                                {loc.municipality}, {loc.province} · {loc.category}
                              </span>
                              <span>•</span>
                              <span className="truncate max-w-[200px]">
                                {loc.sentinelFacility || "Sentinel Health Unit"}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-semibold">
                            {loc.diseaseName}
                          </Badge>
                        </TableCell>
                        <TableCell>{riskBadge(loc.riskLevel)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden hidden sm:block">
                              <div
                                className={`h-full rounded-full ${
                                  prob >= 75
                                    ? "bg-rose-500"
                                    : prob >= 40
                                    ? "bg-amber-500"
                                    : "bg-emerald-500"
                                }`}
                                style={{ width: `${Math.min(100, prob)}%` }}
                              />
                            </div>
                            <span className="font-mono font-bold tabular-nums text-foreground">
                              {prob}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono font-extrabold tabular-nums text-foreground">
                          {loc.activeCases}
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold tabular-nums">
                          <span
                            className={`inline-flex items-center ${
                              loc.changePercent > 0
                                ? "text-rose-600 dark:text-rose-400"
                                : loc.changePercent < 0
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-muted-foreground"
                            }`}
                          >
                            {loc.changePercent > 0 ? (
                              <TrendingUp size={12} className="mr-0.5" />
                            ) : loc.changePercent < 0 ? (
                              <TrendingDown size={12} className="mr-0.5" />
                            ) : null}
                            {loc.changePercent > 0
                              ? `+${loc.changePercent}%`
                              : `${loc.changePercent}%`}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </div>
      )}

      {/* Tab: Feed Ingestion Pipelines View */}
      {activeTab === "pipelines" && (
        <Card className="p-5 space-y-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-foreground">Active Ingestion Pipelines</h3>
            <p className="text-xs text-muted-foreground">
              Automated telemetry feeds synchronizing epidemiological case reports, Open-Meteo meteorological vectors, and CAMS air quality signals.
            </p>
          </div>
          <FeedTable feeds={feeds} />
        </Card>
      )}
    </div>
  );
}
