"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ListChecks, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserSession } from "@/hooks/use-user-session";

const navItems = [
  { href: "/", label: "ホーム", icon: Home },
  { href: "/actions", label: "やること", icon: ListChecks },
  { href: "/mypage", label: "その他", icon: MoreHorizontal },
];

export function BottomNav() {
  const pathname = usePathname();
  const { session } = useUserSession();
  const hasActions = session.caseFile
    ? session.caseFile.pendingActions.length +
        session.caseFile.completedActions.length >
      0
    : session.actions.length > 0;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background safe-bottom">
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-2 py-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href ||
            (href === "/actions" && pathname.startsWith("/actions")) ||
            (href === "/mypage" &&
              (pathname.startsWith("/mypage") ||
                pathname.startsWith("/about") ||
                pathname.startsWith("/settings") ||
                pathname.startsWith("/faq") ||
                pathname.startsWith("/records") ||
                pathname.startsWith("/chat")));

          const displayLabel =
            href === "/actions" && hasActions ? "やること" : label;

          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-w-[80px] flex-col items-center gap-1 rounded-xl px-4 py-2 text-xs font-medium transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-6 w-6" />
              <span>{displayLabel}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
