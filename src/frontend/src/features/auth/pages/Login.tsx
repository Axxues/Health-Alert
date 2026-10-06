import { useState } from "react";
import { useNavigate } from "react-router";
import { authApi } from "@/services/auth/api";
import { isServerUnreachable, setSession } from "@/utils/auth";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import {
  Check,
  Shield,
  Lock,
  User,
  ArrowRight,
  Radio,
} from "lucide-react";
import { Button, Input } from "@/components/ui";

export function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function fail(e: unknown) {
    setError(
      isServerUnreachable(e)
        ? "Cannot reach surveillance backend. Please ensure the server is active on port 5109."
        : "Invalid credentials. Please verify your username and password."
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
    <div className="min-h-screen flex flex-col md:flex-row bg-background text-foreground select-none">
      {/* Left Enterprise Hero Panel */}
      <div className="hidden md:flex md:w-1/2 bg-muted/30 border-r border-border p-12 lg:p-16 flex-col justify-between relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
              <Shield size={20} strokeWidth={2.5} />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-foreground block">
                HealthAlert
              </span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground block -mt-1">
                BantayHealthAI
              </span>
            </div>
          </div>

          <div className="mt-20 max-w-md space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-semibold text-primary">
              <Radio size={12} className="animate-pulse" />
              <span>National Epidemiological Sentinel Network</span>
            </div>

            <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
              Today&apos;s outbreak outlook, before the clinic opens.
            </h1>

            <p className="text-xs lg:text-sm text-muted-foreground leading-relaxed">
              Real-time multi-syndromic outbreak prediction, recursive bi-LSTM trajectory vectors, and automated DOH clinical action playbooks on one unified intelligence command screen.
            </p>

            <div className="pt-4 space-y-3">
              <div className="flex items-center gap-3 text-xs text-foreground font-medium">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0">
                  <Check size={12} strokeWidth={2.5} />
                </div>
                <span>Automated DOH PIDSR & EDCS-IS linelist ingestion</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-foreground font-medium">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0">
                  <Check size={12} strokeWidth={2.5} />
                </div>
                <span>Environmental covariate fusion (Open-Meteo & ERA5)</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-foreground font-medium">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0">
                  <Check size={12} strokeWidth={2.5} />
                </div>
                <span>Role-based clinical action playbooks & stockpile monitoring</span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 pt-8 border-t border-border/60 text-[11px] text-muted-foreground flex items-center justify-between">
          <span>RA 11332 & RA 10173 Compliant</span>
          <span>Region I RESU · DOH</span>
        </div>
      </div>

      {/* Right Login Form */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-12 lg:p-16 relative bg-card">
        <div className="flex justify-between items-center md:justify-end">
          <div className="flex md:hidden items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
              <Shield size={16} strokeWidth={2.5} />
            </div>
            <span className="font-extrabold text-sm text-foreground">HealthAlert</span>
          </div>
          <ThemeToggle />
        </div>

        <div className="w-full max-w-sm mx-auto my-auto space-y-6">
          <div className="space-y-1.5">
            <h2 className="text-2xl font-extrabold tracking-tight text-foreground">
              Sign In to Command Center
            </h2>
            <p className="text-xs text-muted-foreground">
              Enter your credentials to access municipal surveillance & forecasting intelligence.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {error && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive font-medium leading-relaxed">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                Username or Officer ID
              </label>
              <Input
                placeholder="e.g. officer or admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                icon={<User size={14} />}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                Password
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                icon={<Lock size={14} />}
                required
              />
            </div>

            <div className="pt-2 space-y-2.5">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={busy}
                className="w-full justify-between"
              >
                <span>Authenticate Credentials</span>
                <ArrowRight size={14} />
              </Button>

              <Button
                type="button"
                variant="outline"
                size="md"
                disabled={busy}
                onClick={guest}
                className="w-full text-muted-foreground hover:text-foreground"
              >
                Quick Demo Access (Guest Mode)
              </Button>
            </div>
          </form>
        </div>

        <div className="text-center text-[11px] text-muted-foreground">
          Department of Health · Provincial Epidemiology & Surveillance Unit
        </div>
      </div>
    </div>
  );
}
