import { Badge } from "@/components/ui/badge";

/* ============================================
   ModelStatusBadge — Colored badge per status
   ============================================ */

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: "نشط", className: "bg-green-600 hover:bg-green-600" },
  INACTIVE: { label: "غير نشط", className: "" },
};

export function ModelStatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status];
  if (!config) return <Badge variant="outline">{status}</Badge>;
  if (status === "INACTIVE") return <Badge variant="secondary">{config.label}</Badge>;
  return <Badge variant="default" className={config.className}>{config.label}</Badge>;
}

const PAYMENT_CONFIG: Record<string, { label: string; className: string }> = {
  PENDING: { label: "بانتظار الدفع", className: "bg-amber-500 hover:bg-amber-500" },
  PARTIALLY_PAID: { label: "دفع جزئي", className: "bg-blue-500 hover:bg-blue-500" },
  PAID: { label: "مدفوع", className: "bg-green-600 hover:bg-green-600" },
};

export function PaymentStatusBadge({ status }: { status: string }) {
  const config = PAYMENT_CONFIG[status];
  if (!config) return <Badge variant="outline">{status}</Badge>;
  return <Badge variant="default" className={config.className}>{config.label}</Badge>;
}
