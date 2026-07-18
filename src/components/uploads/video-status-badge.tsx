import { Badge } from "@/components/ui/badge";

/* ============================================
   VideoStatusBadge — Colored badge per status
   ============================================ */

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  UPLOADING: {
    label: "جاري الرفع",
    className: "bg-blue-500 hover:bg-blue-500",
  },
  PROCESSING: {
    label: "قيد المعالجة",
    className: "bg-amber-500 hover:bg-amber-500",
  },
  READY: {
    label: "جاهز",
    className: "bg-green-600 hover:bg-green-600",
  },
  FAILED: {
    label: "فشل",
    className: "bg-red-500 hover:bg-red-500",
  },
  DELETED: {
    label: "محذوف",
    className: "",
  },
};

export function VideoStatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status];

  if (!config) {
    return <Badge variant="outline">{status}</Badge>;
  }

  if (status === "DELETED") {
    return <Badge variant="secondary">{config.label}</Badge>;
  }

  return (
    <Badge variant="default" className={config.className}>
      {config.label}
    </Badge>
  );
}
