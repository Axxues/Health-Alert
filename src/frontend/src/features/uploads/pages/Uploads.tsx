import { useEffect, useState } from "react";
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  Users,
  Check,
  X,
} from "lucide-react";
import {
  downloadTemplate,
  listBatches,
  listIssues,
  populationTemplate,
  resolveIssue,
  uploadBatch,
  uploadPopulation,
} from "@/services/uploads/api/uploads.api";
import type {
  PopulationUploadResult,
  UploadBatch,
  UploadIssue,
  UploadResult,
} from "@/services/uploads/types/uploads.types";
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
  PageHeader,
} from "@/components/ui";

export function Uploads() {
  const [batches, setBatches] = useState<UploadBatch[]>([]);
  const [issues, setIssues] = useState<UploadIssue[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<number | null>(null);
  const [issuesOpen, setIssuesOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [popFile, setPopFile] = useState<File | null>(null);
  const [popResult, setPopResult] = useState<PopulationUploadResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [issuesLoading, setIssuesLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [popUploading, setPopUploading] = useState(false);
  const [error, setError] = useState("");

  const refresh = () => {
    setLoading(true);
    setError("");
    listBatches()
      .then(setBatches)
      .catch(() => setError("Failed to retrieve upload batches."))
      .finally(() => setLoading(false));
  };

  useEffect(refresh, []);

  const selectBatch = (id: number) => {
    setSelectedBatch(id);
    setIssuesOpen(true);
    setIssuesLoading(true);
    listIssues(id)
      .then(setIssues)
      .catch(() => setError("Failed to retrieve quarantined rows."))
      .finally(() => setIssuesLoading(false));
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError("");
    await uploadBatch(file)
      .then((r) => {
        setResult(r);
        setFile(null);
        refresh();
      })
      .catch(() => setError("Failed to upload weekly report."))
      .finally(() => setUploading(false));
  };

  const handleResolve = async (id: number, action: "accept" | "discard") => {
    await resolveIssue(id, action).catch(() => setError("Failed to resolve row."));
    if (selectedBatch !== null) {
      listIssues(selectedBatch).then(setIssues).catch(() => {});
    }
    refresh();
  };

  const handlePopUpload = async () => {
    if (!popFile) return;
    setPopUploading(true);
    setError("");
    await uploadPopulation(popFile)
      .then((r) => {
        setPopResult(r);
        setPopFile(null);
      })
      .catch(() => setError("Failed to upload population file."))
      .finally(() => setPopUploading(false));
  };

  const openIssues = issues.filter((i) => !i.resolved);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="PIDSR Linelist & Population Ingestion"
        description="Batch ingestion portal for weekly municipal PIDSR linelists and annual barangay census baselines with automated schema validation."
        badge={
          <Badge variant="primary">
            {batches.length} Weekly Batches Ingested
          </Badge>
        }
        actions={
          <Button
            variant="outline"
            size="sm"
            icon={<Download size={14} />}
            onClick={() => downloadTemplate().catch(() => setError("Failed to download template."))}
          >
            Download CSV Template
          </Button>
        }
      />

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-xs font-medium text-destructive">
          <AlertTriangle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Upload Zones Dual Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Weekly Report Linelist Card */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div>
              <CardTitle>Weekly PIDSR Linelist Ingestion</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Upload weekly epidemiological case submissions (.csv format)
              </p>
            </div>
            <FileSpreadsheet size={18} className="text-primary" />
          </div>

          <div className="rounded-xl border-2 border-dashed border-border/80 bg-muted/20 p-6 text-center hover:bg-muted/40 transition-colors">
            <UploadCloud size={32} className="mx-auto text-muted-foreground mb-2" />
            <div className="text-xs text-muted-foreground mb-3">
              {file ? (
                <span className="font-semibold text-foreground">{file.name}</span>
              ) : (
                <span>Select or drop PIDSR weekly report CSV</span>
              )}
            </div>
            <input
              type="file"
              id="weekly-file"
              accept=".csv,text/csv"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="hidden"
            />
            <label htmlFor="weekly-file">
              <Button variant="outline" size="sm" type="button" onClick={() => document.getElementById("weekly-file")?.click()}>
                Choose File
              </Button>
            </label>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-muted-foreground">UTF-8 Encoded · DOH Linelist Spec</span>
            <Button
              variant="primary"
              size="sm"
              onClick={handleUpload}
              loading={uploading}
              disabled={!file}
              icon={<UploadCloud size={14} />}
            >
              Upload Linelist Batch
            </Button>
          </div>

          {result && (
            <div className="rounded-lg bg-muted/50 p-3 text-xs border border-border/60 space-y-1">
              <div className="font-bold text-foreground">Batch #{result.batchId} Results:</div>
              <div className="flex items-center gap-3 text-[11px] font-mono">
                <span className="text-emerald-600 dark:text-emerald-400">{result.accepted} Accepted</span>
                <span className="text-rose-600 dark:text-rose-400">{result.quarantined} Quarantined</span>
                <span className="text-muted-foreground">{result.duplicates} Duplicates</span>
              </div>
            </div>
          )}
        </Card>

        {/* Annual Barangay Population Census Card */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div>
              <CardTitle>Annual Barangay Population Census</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Update municipal denominator baselines for incidence calculations
              </p>
            </div>
            <Users size={18} className="text-primary" />
          </div>

          <div className="rounded-xl border-2 border-dashed border-border/80 bg-muted/20 p-6 text-center hover:bg-muted/40 transition-colors">
            <UploadCloud size={32} className="mx-auto text-muted-foreground mb-2" />
            <div className="text-xs text-muted-foreground mb-3">
              {popFile ? (
                <span className="font-semibold text-foreground">{popFile.name}</span>
              ) : (
                <span>Select or drop barangay census CSV</span>
              )}
            </div>
            <input
              type="file"
              id="pop-file"
              accept=".csv,text/csv"
              onChange={(e) => setPopFile(e.target.files?.[0] ?? null)}
              className="hidden"
            />
            <label htmlFor="pop-file">
              <Button variant="outline" size="sm" type="button" onClick={() => document.getElementById("pop-file")?.click()}>
                Choose File
              </Button>
            </label>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => populationTemplate().catch(() => setError("Failed to download population template."))}
              icon={<Download size={12} />}
            >
              Census Template
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handlePopUpload}
              loading={popUploading}
              disabled={!popFile}
              icon={<UploadCloud size={14} />}
            >
              Update Population
            </Button>
          </div>

          {popResult && (
            <div className="rounded-lg bg-muted/50 p-3 text-xs border border-border/60 space-y-1">
              <div className="font-bold text-foreground">Population Upload Summary:</div>
              <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                {popResult.accepted} records accepted ({popResult.errors} errors)
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Batch Submissions History Table */}
      <Card>
        <CardHeader className="pb-3 border-b border-border/60 flex flex-row items-center justify-between">
          <div>
            <CardTitle>Batch Submissions History</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Historical submissions log with schema quarantine breakdown
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={refresh}>
            Refresh
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch ID</TableHead>
                <TableHead>File Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Accepted</TableHead>
                <TableHead className="text-right">Quarantined</TableHead>
                <TableHead className="text-right">Duplicates</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-xs text-muted-foreground">
                    Loading submissions history...
                  </TableCell>
                </TableRow>
              ) : batches.length === 0 ? (
                <TableEmpty colSpan={7} message="No weekly submissions uploaded yet." />
              ) : (
                batches.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-mono font-bold text-foreground">#{b.id}</TableCell>
                    <TableCell className="font-medium text-foreground">{b.fileName ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={b.quarantined > 0 ? "warning" : "success"}>
                        {b.status ?? "Processed"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums text-foreground">{b.accepted}</TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      <span className={b.quarantined > 0 ? "text-rose-600 dark:text-rose-400 font-bold" : "text-muted-foreground"}>
                        {b.quarantined}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums text-muted-foreground">{b.duplicates}</TableCell>
                    <TableCell className="text-right">
                      {b.quarantined > 0 ? (
                        <Button variant="outline" size="sm" onClick={() => selectBatch(b.id)}>
                          Review Issues ({b.quarantined})
                        </Button>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">Clean</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Quarantined Issues Resolution Dialog */}
      <Dialog
        open={issuesOpen}
        onClose={() => setIssuesOpen(false)}
        title={`Quarantined Rows — Batch #${selectedBatch}`}
        description={`${openIssues.length} unresolved rows flagged by the validation engine.`}
        maxWidth="max-w-3xl"
        footer={
          <Button variant="outline" size="sm" onClick={() => setIssuesOpen(false)}>
            Close
          </Button>
        }
      >
        {issuesLoading ? (
          <div className="py-8 text-center text-xs text-muted-foreground">Loading quarantined rows...</div>
        ) : issues.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">No quarantined rows in this batch.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Row #</TableHead>
                <TableHead>Error Reason</TableHead>
                <TableHead>Disease</TableHead>
                <TableHead>Source Key</TableHead>
                <TableHead className="text-right">Resolution</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {issues.map((i) => (
                <TableRow key={i.id}>
                  <TableCell className="font-mono font-bold">{i.row}</TableCell>
                  <TableCell>
                    <Badge variant="danger">{i.reason ?? "Validation Error"}</Badge>
                  </TableCell>
                  <TableCell className="capitalize">{i.disease ?? "—"}</TableCell>
                  <TableCell className="font-mono text-muted-foreground text-[11px]">{i.sourceKey ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    {i.resolved ? (
                      <span className="text-[11px] font-semibold text-muted-foreground capitalize">
                        {i.resolution ?? "resolved"}
                      </span>
                    ) : (
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          icon={<Check size={12} />}
                          onClick={() => handleResolve(i.id, "accept")}
                        >
                          Accept
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          icon={<X size={12} />}
                          onClick={() => handleResolve(i.id, "discard")}
                        >
                          Discard
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Dialog>
    </div>
  );
}
