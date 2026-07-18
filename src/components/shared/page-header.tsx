"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { cn } from "@/lib/utils/cn";
import { BREADCRUMB_LABELS } from "@/lib/constants/navigation";

/* ============================================
   PageHeader — Title, description, breadcrumb
   ============================================ */

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
};

export function PageHeader({
  title,
  description,
  actions,
  breadcrumbs,
}: PageHeaderProps) {
  const pathname = usePathname();

  const computedBreadcrumbs = breadcrumbs ?? generateBreadcrumbs(pathname);

  return (
    <div className="flex flex-col gap-3">
      {/* Breadcrumb */}
      <nav aria-label="مسار التنقل" className="flex items-center gap-1 text-sm text-muted-foreground">
        {computedBreadcrumbs.map((crumb, index) => {
          const isLast = index === computedBreadcrumbs.length - 1;
          return (
            <span key={`${crumb.label}-${index}`} className="flex items-center gap-1">
              {crumb.href && !isLast ? (
                <Link
                  href={crumb.href}
                  className="transition-colors hover:text-foreground"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className={cn(isLast && "font-medium text-foreground")}>
                  {crumb.label}
                </span>
              )}
              {!isLast && <ChevronLeft className="h-3.5 w-3.5 rtl-flip" />}
            </span>
          );
        })}
      </nav>

      {/* Title row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>
    </div>
  );
}

/* ── Helpers ──────────────────────────────── */

function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split("/").filter(Boolean);
  const items: BreadcrumbItem[] = [
    { label: BREADCRUMB_LABELS["dashboard"] ?? "الرئيسية", href: "/dashboard" },
  ];

  let href = "/dashboard";
  for (let i = 1; i < segments.length; i++) {
    const segment = segments[i]!;
    href += `/${segment}`;
    items.push({
      label: BREADCRUMB_LABELS[segment] ?? segment,
      href,
    });
  }

  return items;
}
