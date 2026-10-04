import { useEffect, useState } from "react";
import { downloadTemplate, listBatches, listIssues, populationTemplate, resolveIssue, uploadBatch, uploadPopulation } from "@/services/uploads/api/uploads.api";
import type { PopulationUploadResult, UploadBatch, UploadIssue, UploadResult } from "@/services/uploads/types/uploads.types";

export function Uploads() {
  const [batches, setBatches] = useState<UploadBatch[]>([]);
  const [issues, setIssues] = useState<UploadIssue[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<number | null>(null);
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
    if (selectedBatch !== null) selectBatch(selectedBatch);
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
    <div className="page-doc" style={{ display: "grid", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: "0 0 4px", fontSize: "24px", fontWeight: 800, letterSpacing: "-0.02em" }}>
            PIDSR uploads
          </h1>
          <p style={{ margin: 0, fontSize: "13px", color: "var(--mute)" }}>
            {batches.length} weekly submissions uploaded
          </p>
        </div>
        <button type="button" className="btn-pill text-xs" onClick={() => downloadTemplate().catch(() => setError("Failed to download template."))}>
          Download template
        </button>
      </div>

      <div className="section-card" style={{ padding: 20, display: "grid", gap: 12 }}>
        <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 700 }}>Upload weekly report</h3>
        <input
          type="file"
          accept=".csv,text/csv"
          aria-label="Weekly report file"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          style={{ fontSize: "13px", color: "var(--ink)" }}
        />
        <div>
          <button type="button" className="btn-pill text-xs" onClick={handleUpload} disabled={!file || uploading}>
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </div>
        {result && (
          <p style={{ margin: 0, fontSize: "13px", color: "var(--ink)" }}>
            Batch #{result.batchId}: {result.accepted} accepted, {result.quarantined} quarantined, {result.duplicates} duplicates
          </p>
        )}
      </div>

      <div className="section-card" style={{ padding: 20, display: "grid", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 700 }}>Annual barangay population</h3>
          <button type="button" className="btn-pill text-xs" onClick={() => populationTemplate().catch(() => setError("Failed to download population template."))}>
            Download template
          </button>
        </div>
        <input
          type="file"
          accept=".csv,text/csv"
          aria-label="Barangay population file"
          onChange={(e) => setPopFile(e.target.files?.[0] ?? null)}
          style={{ fontSize: "13px", color: "var(--ink)" }}
        />
        <div>
          <button type="button" className="btn-pill text-xs" onClick={handlePopUpload} disabled={!popFile || popUploading}>
            {popUploading ? "Uploading..." : "Upload"}
          </button>
        </div>
        {popResult && (
          <p style={{ margin: 0, fontSize: "13px", color: "var(--ink)" }}>
            Population: {popResult.accepted} accepted, {popResult.errors} errors
          </p>
        )}
        {popResult && popResult.errorLines.length > 0 && (
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: "12.5px", color: "var(--mute)", display: "grid", gap: 2 }}>
            {popResult.errorLines.slice(0, 5).map((line) => (
              <li key={line}>{line}</li>
            ))}
            {popResult.errorLines.length > 5 && <li>…and {popResult.errorLines.length - 5} more</li>}
          </ul>
        )}
      </div>

      {error && <p style={{ fontSize: "13px", color: "var(--red)" }}>{error}</p>}

      {loading ? (
        <p style={{ padding: "32px 0", textAlign: "center", color: "var(--mute)", fontSize: "13px" }}>
          Loading upload batches...
        </p>
      ) : batches.length === 0 ? (
        <p style={{ padding: "32px 0", textAlign: "center", color: "var(--mute)", fontSize: "13px" }}>
          No weekly reports uploaded yet.
        </p>
      ) : (
        <div style={{ border: "1px solid var(--hairline)", borderRadius: 12, overflowX: "auto", background: "var(--card)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", minWidth: 640 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--hairline)", background: "var(--muted)" }}>
                {(["Batch", "File", "Status", "Accepted", "Quarantined", "Duplicates"] as const).map((h) => (
                  <th key={h} style={{ textAlign: "left", fontSize: "11.5px", fontWeight: 600, color: "var(--mute)", padding: "10px 16px", whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ))}
                <th style={{ width: 120 }} aria-label="Action" />
              </tr>
            </thead>
            <tbody>
              {batches.map((b) => (
                <tr key={b.id} style={{ borderBottom: "1px solid var(--hairline)" }}>
                  <td style={{ padding: "11px 16px", fontWeight: 700, color: "var(--ink)", whiteSpace: "nowrap" }}>#{b.id}</td>
                  <td style={{ padding: "11px 16px", color: "var(--ink)" }}>{b.fileName ?? "—"}</td>
                  <td style={{ padding: "11px 16px", textTransform: "capitalize", whiteSpace: "nowrap" }}>{b.status ?? "—"}</td>
                  <td style={{ padding: "11px 16px", whiteSpace: "nowrap" }}>{b.accepted}</td>
                  <td style={{ padding: "11px 16px", whiteSpace: "nowrap" }}>{b.quarantined}</td>
                  <td style={{ padding: "11px 16px", whiteSpace: "nowrap" }}>{b.duplicates}</td>
                  <td style={{ padding: "11px 16px", textAlign: "right", whiteSpace: "nowrap" }}>
                    <button type="button" className="btn-pill text-xs" onClick={() => selectBatch(b.id)}>
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedBatch !== null && (
        <div style={{ display: "grid", gap: 12 }}>
          <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 700 }}>
            Quarantined rows — batch #{selectedBatch} ({openIssues.length} open)
          </h3>
          {issuesLoading ? (
            <p style={{ fontSize: "13px", color: "var(--mute)" }}>Loading quarantined rows...</p>
          ) : issues.length === 0 ? (
            <p style={{ fontSize: "13px", color: "var(--mute)" }}>No quarantined rows in this batch.</p>
          ) : (
            <div style={{ border: "1px solid var(--hairline)", borderRadius: 12, overflowX: "auto", background: "var(--card)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", minWidth: 640 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--hairline)", background: "var(--muted)" }}>
                    {(["Row", "Reason", "Disease", "Source key"] as const).map((h) => (
                      <th key={h} style={{ textAlign: "left", fontSize: "11.5px", fontWeight: 600, color: "var(--mute)", padding: "10px 16px", whiteSpace: "nowrap" }}>
                        {h}
                      </th>
                    ))}
                    <th style={{ width: 200 }} aria-label="Action" />
                  </tr>
                </thead>
                <tbody>
                  {issues.map((i) => (
                    <tr key={i.id} style={{ borderBottom: "1px solid var(--hairline)" }}>
                      <td style={{ padding: "11px 16px", whiteSpace: "nowrap" }}>{i.row}</td>
                      <td style={{ padding: "11px 16px", whiteSpace: "nowrap" }}>{i.reason ?? "—"}</td>
                      <td style={{ padding: "11px 16px", whiteSpace: "nowrap" }}>{i.disease ?? "—"}</td>
                      <td style={{ padding: "11px 16px", color: "var(--ink)" }}>{i.sourceKey ?? "—"}</td>
                      <td style={{ padding: "11px 16px", textAlign: "right", whiteSpace: "nowrap" }}>
                        {i.resolved ? (
                          <span style={{ fontSize: "12px", color: "var(--mute)" }}>{i.resolution ?? "resolved"}</span>
                        ) : (
                          <span style={{ display: "inline-flex", gap: 8 }}>
                            <button type="button" className="btn-pill text-xs" onClick={() => handleResolve(i.id, "accept")}>
                              Accept
                            </button>
                            <button type="button" className="btn-pill text-xs" onClick={() => handleResolve(i.id, "discard")}>
                              Discard
                            </button>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
