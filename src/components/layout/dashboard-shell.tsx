"use client";

import { type ReactNode } from "react";

import { SidebarProvider } from "@/hooks/use-sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Footer } from "@/components/layout/footer";

/* ============================================
   DashboardShell — Client wrapper
   Manages sidebar state, wraps all layout pieces
   ============================================ */

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <TooltipProvider delayDuration={300}>
        <div className="flex min-h-screen bg-background">
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
          >
            تخطّي إلى المحتوى
          </a>
          <Sidebar />
          <MobileNav />
          <div className="flex min-w-0 flex-1 flex-col">
            <Header />
            <main id="main-content" className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
              {children}
            </main>
            <Footer />
          </div>
        </div>
      </TooltipProvider>
    </SidebarProvider>
  );
}
