import { Link } from "react-router";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export function Unauthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-lg space-y-5">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
          <ShieldAlert size={28} strokeWidth={2} />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Access Restricted
          </h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Your assigned role does not hold clearance for this epidemiological partition. Contact your Municipal Health Officer or system administrator for access privileges.
          </p>
        </div>

        <div className="pt-2">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 w-full rounded-md bg-primary py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
          >
            <ArrowLeft size={14} strokeWidth={2.2} />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
