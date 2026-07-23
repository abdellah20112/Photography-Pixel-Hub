import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";

/* ============================================
   ReviewStatusBadge — Workflow status badge
   Shows review state with color coding.
   ============================================ */

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string; dotColor: string }
> = {
  NEW: { label: "جديد", className: "bg-gray-500/10 text-gray-500 border-gray-500/20", dotColor: "bg-gray-500" },
  PLANNING: { label: "تخطيط", className: "bg-blue-500/10 text-blue-500 border-blue-500/20", dotColor: "bg-blue-500" },
  SHOOTING: { label: "تصوير", className: "bg-purple-500/10 text-purple-500 border-purple-500/20", dotColor: "bg-purple-500" },
  EDITING: { label: "مونتاج", className: "bg-amber-500/10 text-amber-500 border-amber-500/20", dotColor: "bg-amber-500" },
  REVIEW: { label: "بانتظار المراجعة", className: "bg-blue-500/10 text-blue-500 border-blue-500/20", dotColor: "bg-blue-500" },
  REVISION: { label: "يلزم تعديلات", className: "bg-orange-500/10 text-orange-500 border-orange-500/20", dotColor: "bg-orange-500" },
  APPROVED: { label: "معتمد", className: "bg-green-500/10 text-green-600 border-green-500/20", dotColor: "bg-green-500" },
  DELIVERED: { label: "تم التسليم", className: "bg-teal-500/10 text-teal-600 border-teal-500/20", dotColor: "bg-teal-500" },
  PAID: { label: "مدفوع", className: "bg-green-600/10 text-green-700 border-green-600/20", dotColor: "bg-green-600" },
  COMPLETED: { label: "مكتمل", className: "bg-green-700/10 text-green-700 border-green-700/20", dotColor: "bg-green-700" },
  ARCHIVED: { label: "مؤرشف", className: "bg-gray-400/10 text-gray-400 border-gray-400/20", dotColor: "bg-gray-400" },
};

export function ReviewStatusBadge({
  status,
  size = "default",
}: {
  status: string;
  size?: "default" | "sm";
}) {
  const config = STATUS_CONFIG[status];

  if (!config) {
    return <Badge variant="outline">{status}</Badge>;
  }

  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 border font-medium", config.className, size === "sm" && "text-[10px] px-1.5 py-0")}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", config.dotColor)} />
      {config.label}
    </Badge>
  );
}
