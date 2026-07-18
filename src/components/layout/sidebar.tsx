"use client";

import Link from "next/link";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { cn } from "@/lib/utils/cn";
import { SidebarItem } from "@/components/shared/sidebar-item";
import { useSidebar } from "@/hooks/use-sidebar";
import {
  NAV_SECTIONS,
  NAV_FOOTER_ITEMS,
} from "@/lib/constants/navigation";
import { BRANDING } from "@/config/branding";

/* ============================================
   Sidebar — Desktop collapsible navigation
   ============================================ */

export function Sidebar() {
  const { collapsed, toggleCollapsed } = useSidebar();

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col border-e bg-sidebar transition-[width] duration-300 ease-in-out",
        collapsed ? "w-[68px]" : "w-64"
      )}
      aria-label="الشريط الجانبي"
    >
      {/* Brand */}
      <div className="flex h-16 shrink-0 items-center border-b px-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={BRANDING.logo.full}
            alt={BRANDING.companyName}
            className="h-8 w-8 shrink-0 rounded-lg object-contain"
          />
          {!collapsed && (
            <span className="truncate text-sm font-bold tracking-tight">
              {BRANDING.shortName}
            </span>
          )}
        </Link>
      </div>

      {/* Nav sections */}
      <nav className="sidebar-scroll flex-1 overflow-y-auto px-3 py-4">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="mb-4 last:mb-0">
            {!collapsed && (
              <h3 className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {section.title}
              </h3>
            )}
            <div className="space-y-1">
              {section.items.map((item) => (
                <SidebarItem
                  key={item.href}
                  item={item}
                  collapsed={collapsed}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer items */}
      <div className="shrink-0 border-t px-3 py-3">
        <div className="space-y-1">
          {NAV_FOOTER_ITEMS.map((item) => (
            <SidebarItem
              key={item.label}
              item={item}
              collapsed={collapsed}
            />
          ))}
        </div>
      </div>

      {/* Collapse toggle */}
      <button
        type="button"
        onClick={toggleCollapsed}
        className="flex h-12 shrink-0 items-center justify-center border-t text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
        aria-label={collapsed ? "توسيع القائمة" : "طي القائمة"}
        aria-expanded={!collapsed}
      >
        {collapsed ? (
          <PanelLeftOpen className="h-5 w-5 rtl-flip" />
        ) : (
          <PanelLeftClose className="h-5 w-5 rtl-flip" />
        )}
      </button>
    </aside>
  );
}
