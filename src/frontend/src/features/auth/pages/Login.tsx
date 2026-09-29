import { useState } from "react";
import { useNavigate } from "react-router";
import { authApi } from "@/services/auth/api";
import { isServerUnreachable, setSession } from "@/utils/auth";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { Activity, Check } from "lucide-react";

export function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function fail(e: unknown) {
    setError(
      isServerUnreachable(e)
        ? "Cannot reach the server. Start the backend on port 5109 first."
        : "Could not sign in. Check your details and try again."
    );
    setBusy(false);
  }

  async function guest() {
    setError("");
    setBusy(true);
    try {
      const data = await authApi.login({ username: "guest", password: "" });
      setSession(data.token, data.role, data.permissions ?? []);
      navigate("/");
    } catch (e) {
      fail(e);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const data = await authApi.login({ username, password });
      setSession(data.token, data.role, data.permissions ?? []);
      navigate("/");
    } catch (err) {
      fail(err);
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Left Enterprise Hero Panel */}
      <div className="hidden md:flex md:w-1/2 bg-muted/40 border-r border-border p-12 flex-col justify-between relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <img
              src="/Health-Nology_StartupLogo_PSC11_2.png"
              alt="Health Alert logo"
              className="h-9 w-9 rounded-lg object-contain shadow-xs"
            />
            <span className="text-base font-bold tracking-tight text-foreground">
              Health Alert
            </span>
          </div>

          <div className="mt-20 max-w-md space-y-4">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-600 dark:text-blue-400">
              <Activity size={13} strokeWidth={2.2} />
              Epidemiological Surveillance System
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground leading-tight">
              Today's outlook, before the clinic opens.
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Outbreak hotspots, bi-LSTM forecast vectors, and rapid clinical SOPs for your municipality — on one unified intelligence screen.
            </p>

            <div className="pt-6 space-y-3">
              <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Check size={12} strokeWidth={2.5} />
                </div>
                <span>Automated DOH PIDSR & EDCS-IS linelist ingestion</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Check size={12} strokeWidth={2.5} />
                </div>
                <span>Environmental covariate fusion (Open-Meteo & ERA5)</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Check size={12} strokeWidth={2.5} />
                </div>
                <span>Role-based clinical action playbooks & stockpile monitoring</span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 pt-8 border-t border-border/50 text-[11px] text-muted-foreground">
          RA 11332 & RA 10173 Compliant · Offline-first architecture · Built for LGUs & RHUs
        </div>
      </div>

      {/* Right Login Form */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-12 relative">
        <div className="flex justify-between items-center md:justify-end">
          <div className="flex md:hidden items-center gap-2">
            <img
              src="/Health-Nology_StartupLogo_PSC11_2.png"
              alt="Health Alert logo"
              className="h-7 w-7 rounded-md object-contain"
            />
            <span className="font-bold text-sm text-foreground">Health Alert</span>
          </div>
          <ThemeToggle />
        </div>

        <div className="w-full max-w-sm mx-auto my-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Welcome back
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Sign in to access municipal surveillance & forecasting intelligence.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400 font-medium">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Username or ID
              </label>
              <input
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
                placeholder="e.g. officer or admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Password
              </label>
              <input
                type="password"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            <div className="pt-2 space-y-2.5">
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-md bg-primary py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs disabled:opacity-50"
              >
                {busy ? "Signing in..." : "Sign in"}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={guest}
                className="w-full rounded-md border border-border bg-card py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
              >
                Continue as guest
              </button>
            </div>
          </form>
        </div>

        <div className="text-center text-[11px] text-muted-foreground">
          Department of Health · Provincial Health Office Surveillance Unit
        </div>
      </div>
    </div>
  );
}
