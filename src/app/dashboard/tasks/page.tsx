import { PageHeader } from "@/components/shared/page-header";
import { TaskBoard } from "@/components/tasks/task-board";

export const metadata = { title: "المهام" };

export default function TasksPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="المهام"
        description="إدارة وتتبع مهام الفريق"
      />
      <TaskBoard />
    </div>
  );
}
