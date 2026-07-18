"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { SidebarItem } from "@/components/shared/sidebar-item";
import { useSidebar } from "@/hooks/use-sidebar";
import {
  NAV_SECTIONS,
  NAV_FOOTER_ITEMS,
} from "@/lib/constants/navigation";
import { BRANDING } from "@/config/branding";

/* ============================================
   MobileNav — Drawer navigation (mobile only)
   ============================================ */

export function MobileNav() {
  const { mobileOpen, setMobileOpen } = useSidebar();

  return (
    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
      <SheetContent side="start" className="flex w-72 flex-col p-0">
        <SheetHeader className="h-16 shrink-0 border-b">
          <SheetTitle className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={BRANDING.logo.full}
              alt={BRANDING.companyName}
              className="h-8 w-8 rounded-lg object-contain"
            />
            <span className="truncate text-sm font-bold">{BRANDING.shortName}</span>
          </SheetTitle>
        </SheetHeader>

        <nav
          className="sidebar-scroll flex-1 overflow-y-auto px-3 py-4"
          aria-label="التنقل"
        >
          {NAV_SECTIONS.map((section) => (
            <div key={section.title} className="mb-4 last:mb-0">
              <h3 className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {section.title}
              </h3>
              <div className="space-y-1">
                {section.items.map((item) => (
                  <SidebarItem
                    key={item.href}
                    item={item}
                    onClick={() => setMobileOpen(false)}
                  />
                ))}
              </div>
            </div>
          ))}

          <div className="border-t pt-3">
            <div className="space-y-1">
              {NAV_FOOTER_ITEMS.map((item) => (
                <SidebarItem
                  key={item.label}
                  item={item}
                  onClick={() => setMobileOpen(false)}
                />
              ))}
            </div>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
