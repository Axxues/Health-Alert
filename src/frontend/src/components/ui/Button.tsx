import React from "react";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive" | "pill";
  size?: "sm" | "md" | "lg" | "icon";
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", size = "md", loading = false, disabled, icon, children, ...props }, ref) => {
    const baseClasses =
      "inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer";

    const variantClasses = {
      primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs border border-primary/20 active:translate-y-px",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border/60 active:translate-y-px",
      outline: "border border-input bg-card text-foreground hover:bg-muted/70 hover:text-foreground active:translate-y-px shadow-xs",
      ghost: "hover:bg-muted/60 text-muted-foreground hover:text-foreground",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-xs active:translate-y-px",
      pill: "bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 rounded-full",
    }[variant];

    const sizeClasses = {
      sm: "h-7 px-2.5 text-xs rounded-md gap-1.5",
      md: "h-9 px-3.5 text-xs font-semibold rounded-md gap-2",
      lg: "h-10 px-4 text-sm font-semibold rounded-lg gap-2.5",
      icon: "h-8 w-8 text-xs rounded-md",
    }[size];

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${baseClasses} ${variantClasses} ${sizeClasses} ${className}`}
        {...props}
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : icon ? <span className="shrink-0">{icon}</span> : null}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
