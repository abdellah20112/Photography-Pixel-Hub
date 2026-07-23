"use client";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { SectionTitle } from "@/components/shared/section-title";
import { Skeleton } from "@/components/ui/skeleton";
import { getWorkflowStatsAction } from "@/actions/workflow/get-workflow-stats";

/* ============================================
   OverviewChart — Workflow status bar chart
   Displays project counts per workflow stage.
   ============================================ */

type ChartItem = {
  label: string;
  value: number;
  color: string;
};

const STAGES: ChartItem[] = [
  { label: "تحرير", value: 0, color: "bg-blue-500" },
  { label: "مراجعة", value: 0, color: "bg-amber-500" },
  { label: "معتمد", value: 0, color: "bg-teal-500" },
  { label: "تم التسليم", value: 0, color: "bg-green-500" },
  { label: "مكتمل", value: 0, color: "bg-indigo-500" },
];

export function OverviewChart() {
  return (
    <DashboardCard className="p-5">
      <SectionTitle title="حالة المشاريع" />
      <div className="mt-6 space-y-4">
        {STAGES.map((stage) => {
          const maxValue = Math.max(...STAGES.map((s) => s.value || 1), 1);
          const widthPercent = (stage.value / maxValue) * 100;
          return (
            <div key={stage.label} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium">{stage.label}</span>
                <span className="text-muted-foreground">{stage.value}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${stage.color}`}
                  style={{ width: `${Math.max(widthPercent, 2)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </DashboardCard>
  );
}
