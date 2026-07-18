import { Badge } from "@/components/ui/badge";

/* ============================================
   RetentionBadge — Retention period badge
   ============================================ */

const RETENTION_LABELS: Record<string, string> = {
  TWENTY_FOUR_HOURS: "24 ساعة",
  FORTY_EIGHT_HOURS: "48 ساعة",
  SEVENTY_TWO_HOURS: "72 ساعة",
  SEVEN_DAYS: "7 أيام",
  CUSTOM: "مخصص",
};

export function RetentionBadge({ period }: { period: string }) {
  const label = RETENTION_LABELS[period] ?? period;
  return <Badge variant="outline">{label}</Badge>;
}
