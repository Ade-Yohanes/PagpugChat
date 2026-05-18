"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type ProgressProps = React.ComponentProps<"div"> & {
  /** Fill amount, 0–100 */
  value?: number | null;
  className?: string;
  indicatorClassName?: string;
};

function Progress({ className, value, indicatorClassName, ...props }: ProgressProps) {
  const pct = Math.min(100, Math.max(0, value ?? 0));

  return (
    <div
      data-slot="progress"
      className={cn("bg-primary/20 relative h-2 w-full overflow-hidden rounded-full", className)}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      {...props}
    >
      <div
        data-slot="progress-indicator"
        className={cn(
          "h-full rounded-full transition-[width] duration-300 ease-out",
          indicatorClassName ?? "bg-primary"
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export { Progress };
