"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { User, Settings, LogOut, ChevronDown } from "lucide-react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession } from "@/providers/session-provider";
import { ROUTES } from "@/lib/constants";
import { logoutAction } from "@/actions/auth/logout";

/* ============================================
   UserMenu — Profile dropdown
   ============================================ */

export function UserMenu() {
  const { user } = useSession();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const displayName = user?.name ?? "مستخدم";
  const displayEmail = user?.email ?? "guest@pixelhub.com";
  const initials = displayName.charAt(0);

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction();
      router.push(ROUTES.LOGIN);
      router.refresh();
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex items-center gap-2 rounded-lg p-1 pe-2 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="قائمة المستخدم"
      >
        <Avatar className="h-8 w-8 border border-border">
          {user?.avatar && (
            <AvatarImage src={user.avatar} alt={displayName} />
          )}
          <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>
        <span className="hidden text-sm font-medium sm:inline-block">
          {displayName}
        </span>
        <ChevronDown className="hidden h-4 w-4 text-muted-foreground sm:inline-block" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="font-medium">{displayName}</span>
          <span className="text-xs font-normal text-muted-foreground">
            {displayEmail}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href={ROUTES.DASHBOARD_PROFILE}>
              <User className="text-muted-foreground" />
              <span>الملف الشخصي</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={ROUTES.DASHBOARD_SETTINGS}>
              <Settings className="text-muted-foreground" />
              <span>الإعدادات</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={handleLogout}
          disabled={isPending}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="text-destructive" />
          <span>تسجيل الخروج</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
