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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-border pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <PackagePlus size={18} strokeWidth={2.2} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">Emergency Stock Requisition</h3>
              <p className="text-xs text-muted-foreground">Direct supply dispatch to Provincial Health Office (PHO)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X size={16} strokeWidth={2.2} />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 size={40} strokeWidth={2} className="mx-auto mb-3" />
            <h4 className="text-base font-bold text-foreground">Requisition Dispatched</h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              Order successfully transmitted to Provincial Logistics Command. Expected arrival within 24–48 hours.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                Medical Item / Therapeutic
              </label>
              <input
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                value={item}
                onChange={(e) => setItem(e.target.value)}
                placeholder="e.g. Oral Rehydration Salts (ORS) or Doxycycline 100mg"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Request Quantity
                </label>
                <input
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  type="number"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Destination Facility
                </label>
                <input
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  value={facility}
                  onChange={(e) => setFacility(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                Epidemiological Justification
              </label>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary min-h-[70px] resize-y"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-border px-3.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
              >
                <Send size={13} strokeWidth={2.2} />
                <span>Submit to PHO</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
