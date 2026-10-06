import React, { useEffect } from "react";
import { X } from "lucide-react";

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
}

export const Dialog: React.FC<DialogProps> = ({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = "max-w-lg",
}) => {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-xs transition-opacity animate-in fade-in-0 duration-150"
        onClick={onClose}
      />

      {/* Modal Dialog Box */}
      <div
        role="dialog"
        aria-modal="true"
        className={`relative z-50 w-full ${maxWidth} rounded-xl border border-border bg-card p-6 shadow-xl animate-in zoom-in-95 duration-150 text-card-foreground`}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <X size={16} />
        </button>

        {(title || description) && (
          <div className="mb-4 space-y-1 pr-6">
            {title && <h2 className="text-base font-bold text-foreground leading-snug">{title}</h2>}
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
        )}

        <div className="space-y-4">{children}</div>

        {footer && <div className="mt-6 flex items-center justify-end gap-2.5 pt-3 border-t border-border/60">{footer}</div>}
      </div>
    </div>
  );
};
