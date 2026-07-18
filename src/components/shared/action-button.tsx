import Link from "next/link";
import { type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

/* ============================================
   ActionButton — Icon + label link button
   ============================================ */

type ActionButtonProps = {
  icon: LucideIcon;
  label: string;
  href: string;
  variant?: "default" | "outline" | "secondary";
  className?: string;
};

export function ActionButton({
  icon: Icon,
  label,
  href,
  variant = "outline",
  className,
}: ActionButtonProps) {
  return (
    <Button
      asChild
      variant={variant}
      className={cn("h-auto justify-start gap-3 py-3", className)}
    >
      <Link href={href}>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </span>
        <span className="text-sm font-medium">{label}</span>
      </Link>
    </Button>
  );
}
