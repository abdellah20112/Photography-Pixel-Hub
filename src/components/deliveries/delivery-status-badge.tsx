import { Badge } from "@/components/ui/badge";

/* ============================================
   DeliveryStatusBadge — Colored badge per status
   ============================================ */

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  ACTIVE: {
    label: "نشط",
    className: "bg-green-600 hover:bg-green-600",
  },
  EXPIRED: {
    label: "منتهي الصلاحية",
    className: "bg-amber-500 hover:bg-amber-500",
  },
  DISABLED: {
    label: "معطّل",
    className: "",
  },
};

export function DeliveryStatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status];

  if (!config) {
    return <Badge variant="outline">{status}</Badge>;
  }

  if (status === "DISABLED") {
    return <Badge variant="secondary">{config.label}</Badge>;
  }

  return (
    <Badge variant="default" className={config.className}>
      {config.label}
    </Badge>
  );
}
