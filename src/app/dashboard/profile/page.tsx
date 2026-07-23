import { PageHeader } from "@/components/shared/page-header";
import { ProfileForm } from "@/components/forms/profile-form";
import { getCurrentUser } from "@/lib/auth/session";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { SectionTitle } from "@/components/shared/section-title";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils/format";

export const metadata = { title: "الملف الشخصي" };

const ROLE_LABELS: Record<string, string> = {
  OWNER: "مالك",
  ADMIN: "مدير",
  EDITOR: "محرر",
  PHOTOGRAPHER: "مصور",
  DESIGNER: "مصمم",
  MEDIA_BUYER: "مشتري إعلامي",
};

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="الملف الشخصي"
        description="عرض وتعديل معلوماتك الشخصية"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile info card */}
        <DashboardCard className="p-6 lg:col-span-1">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-3xl font-bold text-primary">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">{user.name}</h3>
              <p className="text-sm text-muted-foreground" dir="ltr">{user.email}</p>
              <Badge variant="secondary" className="mt-2">
                {ROLE_LABELS[user.role] ?? user.role}
              </Badge>
            </div>
          </div>
        </DashboardCard>

        {/* Profile form */}
        <div className="lg:col-span-2">
          <DashboardCard className="p-6">
            <SectionTitle title="تعديل المعلومات" />
            <div className="mt-6">
              <ProfileForm
                defaultName={user.name}
                defaultAvatar={user.avatar ?? ""}
              />
            </div>
          </DashboardCard>
        </div>
      </div>
    </div>
  );
}
