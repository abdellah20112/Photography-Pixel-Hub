import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Upload,
  Package,
  UserCircle,
  Wallet,
  UsersRound,
  CalendarDays,
  ListChecks,
  LineChart,
  Activity,
  BarChart3,
  Settings,
  User,
  LogOut,
  type LucideIcon,
} from "lucide-react";

import { ROUTES } from "@/lib/constants/routes";

/* ============================================
   Sidebar Navigation Configuration
   ============================================ */

export type NavItem = {
  label: string;
  href?: string;
  icon: LucideIcon;
  action?: "logout";
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

export const NAV_SECTIONS: NavSection[] = [
  {
    title: "الرئيسية",
    items: [
      {
        label: "لوحة التحكم",
        href: ROUTES.DASHBOARD,
        icon: LayoutDashboard,
      },
      {
        label: "العملاء",
        href: ROUTES.DASHBOARD_CLIENTS,
        icon: Users,
      },
      {
        label: "المشاريع",
        href: ROUTES.DASHBOARD_PROJECTS,
        icon: FolderKanban,
      },
      {
        label: "الرفع",
        href: ROUTES.DASHBOARD_UPLOADS,
        icon: Upload,
      },
      {
        label: "التسليم",
        href: ROUTES.DASHBOARD_DELIVERIES,
        icon: Package,
      },
      {
        label: "الموديلات",
        href: ROUTES.DASHBOARD_MODELS,
        icon: UserCircle,
      },
      {
        label: "المالية",
        href: ROUTES.DASHBOARD_FINANCE,
        icon: Wallet,
      },
      {
        label: "الفريق",
        href: ROUTES.DASHBOARD_TEAM,
        icon: UsersRound,
      },
      {
        label: "التقويم",
        href: ROUTES.DASHBOARD_CALENDAR,
        icon: CalendarDays,
      },
      {
        label: "المهام",
        href: ROUTES.DASHBOARD_TASKS,
        icon: ListChecks,
      },
      {
        label: "لوحة القيادة",
        href: ROUTES.DASHBOARD_EXECUTIVE,
        icon: LineChart,
      },
      {
        label: "النشاط",
        href: ROUTES.DASHBOARD_ACTIVITY,
        icon: Activity,
      },
      {
        label: "التحليلات",
        href: ROUTES.DASHBOARD_ANALYTICS,
        icon: BarChart3,
      },
    ],
  },
];

export const NAV_FOOTER_ITEMS: NavItem[] = [
  {
    label: "الإعدادات",
    href: ROUTES.DASHBOARD_SETTINGS,
    icon: Settings,
  },
  {
    label: "الملف الشخصي",
    href: ROUTES.DASHBOARD_PROFILE,
    icon: User,
  },
  {
    label: "تسجيل الخروج",
    icon: LogOut,
    action: "logout",
  },
];

/* ── Page Titles (Arabic) ────────────────── */

export const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "لوحة التحكم",
  "/dashboard/clients": "العملاء",
  "/dashboard/projects": "المشاريع",
  "/dashboard/uploads": "الرفع",
  "/dashboard/deliveries": "التسليم",
  "/dashboard/models": "الموديلات",
  "/dashboard/finance": "المالية",
  "/dashboard/team": "الفريق",
  "/dashboard/calendar": "التقويم",
  "/dashboard/tasks": "المهام",
  "/dashboard/executive": "لوحة القيادة",
  "/dashboard/activity": "النشاط",
  "/dashboard/analytics": "التحليلات",
  "/dashboard/settings": "الإعدادات",
  "/dashboard/profile": "الملف الشخصي",
};

/* ── Breadcrumb Labels ───────────────────── */

export const BREADCRUMB_LABELS: Record<string, string> = {
  dashboard: "لوحة التحكم",
  clients: "العملاء",
  projects: "المشاريع",
  uploads: "الرفع",
  deliveries: "التسليم",
  models: "الموديلات",
  finance: "المالية",
  team: "الفريق",
  calendar: "التقويم",
  tasks: "المهام",
  executive: "لوحة القيادة",
  activity: "النشاط",
  analytics: "التحليلات",
  settings: "الإعدادات",
  profile: "الملف الشخصي",
};
