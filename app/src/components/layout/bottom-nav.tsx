"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleCheck, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBottomChrome } from "@/providers/bottom-chrome-provider";

/** 2タブにしてスクロール領域を確保。ホームはヘッダー／メニューから。 */
const navItems = [
  { href: "/actions", label: "やること", icon: CircleCheck },
  { href: "/mypage", label: "その他", icon: MoreHorizontal },
] as const;

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
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-2 py-1.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active =
            (href === "/actions" &&
              (pathname === "/" ||
                pathname.startsWith("/actions") ||
                pathname.startsWith("/records"))) ||
            (href === "/mypage" &&
              (pathname.startsWith("/mypage") ||
                pathname.startsWith("/about") ||
                pathname.startsWith("/settings") ||
                pathname.startsWith("/faq") ||
                pathname.startsWith("/updates") ||
                pathname.startsWith("/chat") ||
                pathname.startsWith("/start")));

          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-w-[100px] flex-1 flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
