"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition, type ReactNode } from "react";

import { cn } from "@/lib/utils/cn";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { NavItem } from "@/lib/constants/navigation";
import { logoutAction } from "@/actions/auth/logout";
import { ROUTES } from "@/lib/constants/routes";

/* ============================================
   SidebarItem — Nav link with active state
   ============================================ */

type SidebarItemProps = {
  item: NavItem;
  collapsed?: boolean;
  onClick?: () => void;
};

export function SidebarItem({ item, collapsed = false, onClick }: SidebarItemProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const Icon = item.icon;

  const handleLogout = () => {
    onClick?.();
    startTransition(async () => {
      await logoutAction();
      router.push(ROUTES.LOGIN);
      router.refresh();
    });
  };

  const isActive = item.href
    ? item.href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(item.href)
    : false;

  const baseClass = cn(
    "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    isActive
      ? "bg-primary/10 text-primary sidebar-active"
      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
    collapsed && "justify-center px-2",
    item.action === "logout" && "text-destructive hover:bg-destructive/10 hover:text-destructive",
    isPending && "opacity-70 pointer-events-none"
  );

  const inner: ReactNode = (
    <>
      <span className="sidebar-active-indicator" />
      <Icon
        className={cn(
          "h-5 w-5 shrink-0 transition-transform duration-200",
          isActive && "text-primary",
          "group-hover:scale-110"
        )}
      />
      {!collapsed && (
        <span className="truncate transition-opacity duration-200">
          {item.label}
        </span>
      )}
    </>
  );

  if (item.action === "logout") {
    const button = (
      <button
        type="button"
        onClick={handleLogout}
        aria-label={item.label}
        className={baseClass}
      >
        {inner}
      </button>
    );

    if (collapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            {button}
          </TooltipTrigger>
          <TooltipContent side="left" className="font-medium">
            {item.label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return button;
  }

  const content = (
    <Link
      href={item.href!}
      onClick={onClick}
      aria-label={item.label}
      aria-current={isActive ? "page" : undefined}
      className={baseClass}
    >
      {inner}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {content}
        </TooltipTrigger>
        <TooltipContent side="left" className="font-medium">
          {item.label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}
