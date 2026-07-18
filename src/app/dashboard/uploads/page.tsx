import { PageHeader } from "@/components/shared/page-header";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { UploadZone } from "@/components/uploads/upload-zone";
import { VideoGrid } from "@/components/uploads/video-grid";

export const metadata = { title: "الرفع" };

export default function UploadsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="الرفع"
        description="رفع وإدارة الفيديوهات"
      />

      <DashboardCard className="p-6">
        <UploadZone />
      </DashboardCard>

      <div>
        <h2 className="mb-4 text-lg font-semibold tracking-tight">مكتبة الفيديوهات</h2>
        <VideoGrid showProjectColumn />
      </div>
    </div>
  );
}
