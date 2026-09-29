import { HeartPulse, PhoneCall, Building2 } from "lucide-react";

export function ReplyCard({ reply }: { reply: string }) {
  if (!reply) return null;

  const isEmergency = /ospital|emergency|danger|delikado|agad/i.test(reply);

  return (
    <div
      className={`rounded-xl border border-border border-l-4 ${
        isEmergency ? "border-l-rose-500" : "border-l-blue-500"
      } bg-card p-5 shadow-sm space-y-4 animate-in fade-in duration-200`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${
            isEmergency
              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
              : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
          }`}
        >
          <HeartPulse size={18} strokeWidth={2.2} />
        </div>
        <div>
          <div className="font-semibold text-foreground text-sm">
            Rekomendasyon ng Serbisyong Pangkalusugan (Health Guidance)
          </div>
          <div className="text-xs text-muted-foreground">
            Bilingual Triage Protocol · DOH & Municipal Health Office
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border/60 bg-muted/30 p-4 text-xs sm:text-sm leading-relaxed text-foreground whitespace-pre-wrap">
        {reply}
      </div>

      {/* Emergency Guidance Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg bg-muted/40 p-3 text-xs border border-border">
        <div className="flex items-center gap-2 text-foreground">
          <Building2 size={15} strokeWidth={2.2} className="text-primary shrink-0" />
          <span>Libreng konsulta at gamot sa inyong pinakamalapit na <strong>Barangay Health Station / RHU</strong></span>
        </div>
        <div className="flex items-center gap-1.5 font-semibold text-rose-600 dark:text-rose-400 shrink-0">
          <PhoneCall size={14} strokeWidth={2.2} />
          <span>Emergency Hotline: 911 / DOH 1555</span>
        </div>
      </div>
    </div>
  );
}
