import { UserPlus, FolderPlus, Upload, BarChart3 } from "lucide-react";

import { ActionButton } from "@/components/shared/action-button";
import { ROUTES } from "@/lib/constants";

/* ============================================
   QuickActions — Grid of action shortcuts
   ============================================ */

const ACTIONS = [
  {
    icon: UserPlus,
    label: "عميل جديد",
    href: ROUTES.DASHBOARD_CLIENTS,
  },
  {
    icon: FolderPlus,
    label: "مشروع جديد",
    href: ROUTES.DASHBOARD_PROJECTS,
  },
  {
    icon: Upload,
    label: "رفع فيديو",
    href: ROUTES.DASHBOARD_UPLOADS,
  },
  {
    icon: BarChart3,
    label: "فتح التحليلات",
    href: ROUTES.DASHBOARD_ANALYTICS,
  },
] as const;

export function QuickActions() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {ACTIONS.map((action) => (
        <ActionButton
          key={action.label}
          icon={action.icon}
          label={action.label}
          href={action.href}
        />
      ))}
    </div>
  );
}
