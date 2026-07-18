"use client";

import { Bell } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/shared/empty-state";

/* ============================================
   NotificationMenu — Bell dropdown
   ============================================ */

export function NotificationMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="الإشعارات"
      >
        <Bell className="h-5 w-5" />
        {/* Unread indicator */}
        <span className="absolute end-2 top-2 h-2 w-2 rounded-full bg-primary" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>الإشعارات</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <EmptyState
          icon={Bell}
          title="لا توجد إشعارات"
          description="ستظهر هنا إشعارات العملاء والمشاريع الجديدة"
          className="py-8"
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
