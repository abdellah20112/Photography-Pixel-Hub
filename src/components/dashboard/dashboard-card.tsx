import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

/* ============================================
   DashboardCard — Styled card wrapper
   Rounded XL · Soft shadow
   ============================================ */

type DashboardCardProps = React.HTMLAttributes<HTMLDivElement>;

export function DashboardCard({ className, ...props }: DashboardCardProps) {
  return (
    <Card
      className={cn("rounded-xl shadow-sm", className)}
      {...props}
    />
  );
}
