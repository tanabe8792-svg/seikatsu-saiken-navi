"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleCheck, Home, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBottomChrome } from "@/providers/bottom-chrome-provider";

/** 3タブ：いまの案内・一覧・マイページをすぐ見つけられるようにする */
const navItems = [
  { href: "/", label: "ホーム", icon: Home, match: "home" as const },
  {
    href: "/actions",
    label: "やること",
    icon: CircleCheck,
    match: "actions" as const,
  },
  {
    href: "/mypage",
    label: "マイページ",
    icon: UserRound,
    match: "mypage" as const,
  },
] as const;

function isActive(
  match: (typeof navItems)[number]["match"],
  pathname: string
): boolean {
  if (match === "home") return pathname === "/";
  if (match === "actions") {
    return (
      pathname.startsWith("/actions") ||
      pathname.startsWith("/records") ||
      pathname.startsWith("/deadlines")
    );
  }
  return (
    pathname.startsWith("/mypage") ||
    pathname.startsWith("/about") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/faq") ||
    pathname.startsWith("/updates") ||
    pathname.startsWith("/chat") ||
    pathname.startsWith("/invite") ||
    pathname.startsWith("/support")
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const { viewportBottomOffset, navHeightPx } = useBottomChrome();

  return (
    <nav
      className="fixed left-0 right-0 z-50 border-t bg-background"
      style={{
        bottom: viewportBottomOffset,
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        minHeight: navHeightPx,
      }}
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-1 py-1.5">
        {navItems.map(({ href, label, icon: Icon, match }) => {
          const active = isActive(match, pathname);

          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-sm font-semibold transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-6 w-6" aria-hidden />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
