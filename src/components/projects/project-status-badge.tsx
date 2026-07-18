import { Badge } from "@/components/ui/badge";

/* ============================================
   ProjectStatusBadge — Colored badge per status
   ============================================ */

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  DRAFT: {
    label: "مسودة",
    className: "bg-slate-500 hover:bg-slate-500",
  },
  IN_PROGRESS: {
    label: "قيد التنفيذ",
    className: "bg-blue-500 hover:bg-blue-500",
  },
  READY: {
    label: "جاهز",
    className: "bg-amber-500 hover:bg-amber-500",
  },
  DOWNLOAD_ENABLED: {
    label: "التحميل مفعّل",
    className: "bg-cyan-500 hover:bg-cyan-500",
  },
  COMPLETED: {
    label: "مكتمل",
    className: "bg-green-600 hover:bg-green-600",
  },
  ARCHIVED: {
    label: "مؤرشف",
    className: "",
  },
};

export function ProjectStatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status];

  if (!config) {
    return <Badge variant="outline">{status}</Badge>;
  }

  if (status === "ARCHIVED") {
    return <Badge variant="secondary">{config.label}</Badge>;
  }

  return (
    <Badge variant="default" className={config.className}>
      {config.label}
    </Badge>
  );
}
