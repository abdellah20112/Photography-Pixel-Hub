"use client";

import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Search, Sun, Moon, Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserMenu } from "@/components/shared/user-menu";
import { NotificationMenu } from "@/components/shared/notification-menu";
import { useSidebar } from "@/hooks/use-sidebar";
import { PAGE_TITLES } from "@/lib/constants/navigation";

/* ============================================
   Header — Sticky top bar
   ============================================ */

export function Header() {
  const pathname = usePathname();
  const { collapsed, toggleCollapsed, setMobileOpen } = useSidebar();
  const { resolvedTheme, setTheme } = useTheme();

  const pageTitle = PAGE_TITLES[pathname] ?? "لوحة التحكم";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-md sm:px-6">
      {/* Mobile hamburger */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => setMobileOpen(true)}
        aria-label="فتح القائمة"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Desktop sidebar toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="hidden lg:flex"
        onClick={toggleCollapsed}
        aria-label="طي/توسيع الشريط الجانبي"
        aria-expanded={!collapsed}
      >
        {collapsed ? (
          <PanelLeftOpen className="h-5 w-5 rtl-flip" />
        ) : (
          <PanelLeftClose className="h-5 w-5 rtl-flip" />
        )}
      </Button>

      {/* Page title */}
      <h2 className="text-sm font-semibold tracking-tight">{pageTitle}</h2>

      {/* Right group */}
      <div className="ms-auto flex items-center gap-1.5 sm:gap-3">
        {/* Search (desktop) */}
        <div className="relative hidden md:block">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="بحث..."
            className="w-44 ps-9 lg:w-56"
            aria-label="بحث"
          />
        </div>

        <NotificationMenu />

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          aria-label="تبديل المظهر"
        >
          <Sun className="hidden h-5 w-5 dark:block" />
          <Moon className="block h-5 w-5 dark:hidden" />
        </Button>

        <UserMenu />
      </div>
    </header>
  );
}
