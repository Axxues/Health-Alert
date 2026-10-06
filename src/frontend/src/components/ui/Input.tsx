import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", icon, rightElement, ...props }, ref) => {
    return (
      <div className="relative flex items-center w-full">
        {icon && <span className="absolute left-3 text-muted-foreground pointer-events-none">{icon}</span>}
        <input
          ref={ref}
          className={`flex h-9 w-full rounded-lg border border-input bg-card px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 shadow-xs transition-colors ${
            icon ? "pl-9" : ""
          } ${rightElement ? "pr-9" : ""} ${className}`}
          {...props}
        />
        {rightElement && <span className="absolute right-3 text-muted-foreground">{rightElement}</span>}
      </div>
    );
  }
);
Input.displayName = "Input";
