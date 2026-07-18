import { Activity } from "lucide-react";

import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { SectionTitle } from "@/components/shared/section-title";

/* ============================================
   RecentActivity — Card with empty state
   ============================================ */

export function RecentActivity() {
  return (
    <Card className="animate-fade-in-up">
      <CardHeader className="pb-4">
        <SectionTitle title="النشاط الأخير" />
      </CardHeader>
      <CardContent>
        <EmptyState
          icon={Activity}
          title="لا يوجد نشاط بعد"
          description="ستظهر هنا آخر التحديثات على العملاء والمشاريع والرفع"
          className="py-10"
        />
      </CardContent>
    </Card>
  );
}
