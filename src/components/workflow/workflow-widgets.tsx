"use client";

import { useState, useEffect, useRef } from "react";
import { Film, Eye, CheckCircle, Package, PartyPopper } from "lucide-react";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { SectionTitle } from "@/components/shared/section-title";
import { getWorkflowStatsAction } from "@/actions/workflow/get-workflow-stats";

/* ============================================
   WorkflowWidgets — Dashboard workflow stats
   ============================================ */

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Film;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <DashboardCard className="p-4">
      <div className="flex items-center gap-3">
        <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </DashboardCard>
  );
}

export function WorkflowWidgets() {
  const [stats, setStats] = useState({
    editing: 0,
    review: 0,
    approved: 0,
    delivered: 0,
    completed: 0,
  });
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    let active = true;
    (async () => {
      const result = await getWorkflowStatsAction();
      if (!active) return;
      setStats(result);
    })();
    return () => { active = false };
  }, []);

  return (
    <div className="space-y-4">
      <SectionTitle title="سير العمل" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard
          icon={Film}
          label="قيد المونتاج"
          value={stats.editing}
          color="bg-amber-500/10 text-amber-500"
        />
        <StatCard
          icon={Eye}
          label="بانتظار المراجعة"
          value={stats.review}
          color="bg-purple-500/10 text-purple-500"
        />
        <StatCard
          icon={CheckCircle}
          label="بانتظار الاعتماد"
          value={stats.approved}
          color="bg-green-500/10 text-green-500"
        />
        <StatCard
          icon={Package}
          label="تم التسليم"
          value={stats.delivered}
          color="bg-indigo-500/10 text-indigo-500"
        />
        <StatCard
          icon={PartyPopper}
          label="مكتمل"
          value={stats.completed}
          color="bg-teal-500/10 text-teal-500"
        />
      </div>
    </div>
  );
}
