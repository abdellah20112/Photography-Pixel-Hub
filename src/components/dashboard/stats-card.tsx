import { type LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

/* ============================================
   StatCard — Metric card with icon
   ============================================ */

type StatCardProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  iconClassName?: string;
  trend?: { value: string; direction: "up" | "down" };
  className?: string;
};

export function StatCard({
  icon: Icon,
  label,
  value,
  iconClassName,
  trend,
  className,
}: StatCardProps) {
  return (
    <Card className={cn("card-hover p-5", className)}>
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10",
            iconClassName
          )}
        >
          <Icon className="h-5 w-5 text-primary" />
        </span>
        {trend && (
          <span
            className={cn(
              "flex items-center gap-0.5 text-xs font-medium",
              trend.direction === "up"
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-destructive"
            )}
          >
            {trend.value}
          </span>
        )}
      </div>
      <div className="mt-4 space-y-1">
        <p className="text-2xl font-bold tracking-tight tabular-nums">
          {value}
        </p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </Card>
  );
}
