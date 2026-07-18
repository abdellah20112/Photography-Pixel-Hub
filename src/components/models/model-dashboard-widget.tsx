"use client";

import { useState, useEffect, useRef } from "react";
import { UserCircle, DollarSign, Clock, TrendingUp } from "lucide-react";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { SectionTitle } from "@/components/shared/section-title";
import { getModelDashboardStatsAction } from "@/actions/models/get-model-stats";
import type { ModelDashboardStats } from "@/types/model";

/* ============================================
   ModelDashboardWidget — Dashboard widget
   ============================================ */

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof UserCircle;
  label: string;
  value: number | string;
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

export function ModelDashboardWidget() {
  const [stats, setStats] = useState<ModelDashboardStats>({
    activeModels: 0,
    busyToday: 0,
    pendingPayments: 0,
    topModels: [],
  });
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    let active = true;
    (async () => {
      const result = await getModelDashboardStatsAction();
      if (!active) return;
      setStats(result);
    })();
    return () => { active = false };
  }, []);

  return (
    <div className="space-y-4">
      <SectionTitle title="الموديلات" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={UserCircle}
          label="موديلات نشطون"
          value={stats.activeModels}
          color="bg-blue-500/10 text-blue-500"
        />
        <StatCard
          icon={Clock}
          label="مشغولون اليوم"
          value={stats.busyToday}
          color="bg-amber-500/10 text-amber-500"
        />
        <StatCard
          icon={DollarSign}
          label="مدفوعات معلقة"
          value={stats.pendingPayments}
          color="bg-red-500/10 text-red-500"
        />
        <StatCard
          icon={TrendingUp}
          label="الأعلى دخلاً"
          value={stats.topModels.length > 0 ? stats.topModels[0]!.fullName.slice(0, 15) : "—"}
          color="bg-green-500/10 text-green-500"
        />
      </div>

      {/* Top Models List */}
      {stats.topModels.length > 0 && (
        <DashboardCard className="p-4">
          <p className="mb-3 text-sm font-semibold">الأعلى دخلاً</p>
          <div className="space-y-2">
            {stats.topModels.map((model, index) => (
              <div key={model.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-bold">{index + 1}</span>
                  <span className="font-medium">{model.fullName}</span>
                  <span className="font-mono text-xs text-muted-foreground">{model.modelCode}</span>
                </div>
                <span className="font-bold">{model.totalEarnings.toFixed(0)}</span>
              </div>
            ))}
          </div>
        </DashboardCard>
      )}
    </div>
  );
}
