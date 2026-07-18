import type { Metadata } from "next";

import { DashboardShell } from "@/components/layout/dashboard-shell";

export const metadata: Metadata = {
  title: "لوحة التحكم",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}
