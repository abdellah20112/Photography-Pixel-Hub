import { cn } from "@/lib/utils/cn";

/* ============================================
   SectionTitle — Heading + optional action
   ============================================ */

type SectionTitleProps = {
  title: string;
  action?: React.ReactNode;
  className?: string;
};

export function SectionTitle({ title, action, className }: SectionTitleProps) {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {action}
    </div>
  );
}
