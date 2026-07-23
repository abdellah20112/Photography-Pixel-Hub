import { PageHeader } from "@/components/shared/page-header";
import { CalendarView } from "@/components/calendar/calendar-view";

export const metadata = { title: "التقويم" };

export default function CalendarPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="التقويم"
        description="جدولة وإدارة جلسات التصوير"
      />
      <CalendarView />
    </div>
  );
}
