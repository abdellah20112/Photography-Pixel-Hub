import { WelcomeCard } from "@/components/dashboard/welcome-card";
import { StatCards } from "@/components/dashboard/stat-cards";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { ReviewWidget } from "@/components/dashboard/review-widget";
import { WorkflowWidgets } from "@/components/workflow/workflow-widgets";
import { ModelDashboardWidget } from "@/components/models/model-dashboard-widget";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { SectionTitle } from "@/components/shared/section-title";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Welcome */}
      <WelcomeCard />

      {/* Statistics */}
      <StatCards />

      {/* Workflow Widgets */}
      <WorkflowWidgets />

      {/* Model Widgets */}
      <ModelDashboardWidget />

      {/* Quick actions + Recent activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardCard className="animate-fade-in-up p-5">
          <SectionTitle title="إجراءات سريعة" />
          <div className="mt-4">
            <QuickActions />
          </div>
        </DashboardCard>

        <RecentActivity />
      </div>

      {/* Review Widget */}
      <ReviewWidget />
    </div>
  );
}
