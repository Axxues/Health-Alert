import React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "danger" | "warning" | "success" | "neutral" | "primary" | "outline";
  pulse?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  className = "",
  variant = "neutral",
  pulse = false,
  children,
  ...props
}) => {
  const variantStyles = {
    danger: "bg-destructive/10 text-destructive border-destructive/20 dark:bg-destructive/15",
    warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    neutral: "bg-muted text-muted-foreground border-border",
    primary: "bg-primary/10 text-primary border-primary/20",
    outline: "bg-transparent text-foreground border-border",
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border tracking-tight ${variantStyles} ${className}`}
      {...props}
    >
      {pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-current" />
        </span>
      )}
      {children}
    </span>
  );
};
