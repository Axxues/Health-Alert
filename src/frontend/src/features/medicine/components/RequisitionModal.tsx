import { useState } from "react";
import { X, Send, PackagePlus, CheckCircle2 } from "lucide-react";

export function RequisitionModal({
  isOpen,
  onClose,
  initialItem = "",
}: {
  isOpen: boolean;
  onClose: () => void;
  initialItem?: string;
}) {
  const [item, setItem] = useState(initialItem);
  const [qty, setQty] = useState("500");
  const [reason, setReason] = useState("Dengue cluster response in high-risk barangays");
  const [facility, setFacility] = useState("San Fernando RHU Main Stockpile");
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 1400);
  }

  return (
    <div className="overlay" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div
        className="card anim"
        style={{
          width: "100%",
          maxWidth: 520,
          background: "var(--card)",
          boxShadow: "var(--shadow-lift)",
          position: "relative",
          zIndex: 40,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="glyph" style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
              <PackagePlus size={18} strokeWidth={2.2} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 17, color: "var(--ink)" }}>Emergency Stock Requisition</h3>
              <p className="sub" style={{ fontSize: "12px" }}>Direct requisition request to Provincial Health Office (PHO)</p>
            </div>
          </div>
          <button className="iconbtn" onClick={onClose} style={{ width: 32, height: 32 }} type="button">
            <X size={16} strokeWidth={2.2} />
          </button>
        </div>

        {submitted ? (
          <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--green)" }}>
            <CheckCircle2 size={44} strokeWidth={2} style={{ marginBottom: 12 }} />
            <h4 style={{ margin: "0 0 6px", fontSize: 18, color: "var(--ink)" }}>Requisition Dispatched</h4>
            <p className="sub" style={{ margin: 0 }}>
              Order transmitted to Provincial Logistics Command. Batch ETA: 24–48 hours.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--mute)", marginBottom: 6 }}>
                MEDICAL ITEM / THERAPEUTIC
              </label>
              <input
                className="input"
                style={{ width: "100%" }}
                value={item}
                onChange={(e) => setItem(e.target.value)}
                placeholder="e.g. Oral Rehydration Salts (ORS) or Doxycycline 100mg"
                required
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--mute)", marginBottom: 6 }}>
                  REQUEST QUANTITY
                </label>
                <input
                  className="input tabular"
                  style={{ width: "100%" }}
                  type="number"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--mute)", marginBottom: 6 }}>
                  DESTINATION FACILITY
                </label>
                <input
                  className="input"
                  style={{ width: "100%" }}
                  value={facility}
                  onChange={(e) => setFacility(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--mute)", marginBottom: 6 }}>
                EPIDEMIOLOGICAL JUSTIFICATION
              </label>
              <textarea
                className="input"
                style={{ width: "100%", minHeight: 70, resize: "vertical" }}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
              <button className="btn-pill btn-pill--ghost" type="button" onClick={onClose}>
                Cancel
              </button>
              <button className="btn-pill" type="submit">
                <Send size={14} strokeWidth={2.2} />
                <span>Submit to PHO</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
