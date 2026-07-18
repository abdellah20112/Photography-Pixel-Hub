import { Users, FolderKanban, Video, Download } from "lucide-react";

import { StatCard } from "@/components/dashboard/stats-card";

/* ============================================
   StatCards — Grid of 4 placeholder metrics
   ============================================ */

const STATS = [
  { icon: Users, label: "العملاء", value: "—", iconClassName: "bg-blue-500/10" },
  { icon: FolderKanban, label: "المشاريع", value: "—", iconClassName: "bg-violet-500/10" },
  { icon: Video, label: "الفيديوهات", value: "—", iconClassName: "bg-emerald-500/10" },
  { icon: Download, label: "التنزيلات", value: "—", iconClassName: "bg-amber-500/10" },
] as const;

export function StatCards() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 stagger-children">
      {STATS.map((stat) => (
        <StatCard
          key={stat.label}
          icon={stat.icon}
          label={stat.label}
          value={stat.value}
          iconClassName={stat.iconClassName}
        />
      ))}
    </div>
  );
}
