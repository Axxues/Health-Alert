import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

export interface MetricCardProps {
  title: string;
  value: React.ReactNode;
  subtitle?: React.ReactNode;
  trend?: {
    delta: string | number;
    positive?: boolean; // true = up, false = down
    neutral?: boolean;
    label?: string;
  };
  icon?: React.ReactNode;
  variant?: "default" | "critical" | "warning" | "success";
  className?: string;
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon,
  variant = "default",
  className = "",
  onClick,
}) => {
  const borderStyles = {
    default: "border-border",
    critical: "border-destructive/40 bg-destructive/5 dark:bg-destructive/10",
    warning: "border-amber-500/40 bg-amber-500/5 dark:bg-amber-500/10",
    success: "border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-500/10",
  }[variant];

  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={`rounded-xl border bg-card p-4 shadow-xs transition-all duration-200 ease-out hover:shadow-md hover:-translate-y-0.5 ${
        onClick ? "cursor-pointer hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-ring" : ""
      } ${borderStyles} ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground truncate">
          {title}
        </span>
        {icon && <span className="text-muted-foreground/80 shrink-0">{icon}</span>}
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-extrabold tracking-tight tabular-nums font-mono text-foreground">
          {value}
        </span>
        {trend && (
          <span
            className={`inline-flex items-center text-[11px] font-semibold tabular-nums ${
              trend.neutral
                ? "text-muted-foreground"
                : trend.positive
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {trend.positive ? (
              <TrendingUp size={12} className="mr-0.5" />
            ) : (
              <TrendingDown size={12} className="mr-0.5" />
            )}
            {trend.delta} {trend.label ? `· ${trend.label}` : ""}
          </span>
        )}
      </div>

      {subtitle && <p className="mt-1 text-xs text-muted-foreground truncate">{subtitle}</p>}
    </div>
  );
};
