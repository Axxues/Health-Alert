import React from "react";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Skeleton: React.FC<SkeletonProps> = ({ className = "", ...props }) => {
  return (
    <div
      className={`animate-pulse rounded-md bg-muted/80 dark:bg-muted/40 ${className}`}
      {...props}
    />
  );
};
