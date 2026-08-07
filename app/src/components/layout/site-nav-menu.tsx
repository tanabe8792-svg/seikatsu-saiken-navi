"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { AppLogo } from "@/components/brand/app-logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MENU_LINKS = [
  { href: "/", label: "ホーム（いまの案内）" },
  { href: "/actions", label: "やることの一覧" },
  { href: "/records", label: "記録した写真" },
  { href: "/mypage", label: "マイページ" },
  { href: "/chat", label: "AIに質問する" },
  { href: "/settings", label: "設定（文字の大きさなど）" },
  { href: "/about", label: "このサービスについて" },
  { href: "/faq", label: "よくある質問" },
] as const;

export function SiteNavMenu() {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="メニューを開く"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {open && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="メニューを閉じる"
            onClick={() => setOpen(false)}
          />
          <div
            id={panelId}
            role="dialog"
            aria-modal="true"
            aria-label="ページメニュー"
            className="absolute right-0 top-0 flex h-full w-[min(100%,20rem)] flex-col border-l bg-background shadow-xl"
          >
            <div className="flex h-14 items-center justify-between border-b px-4">
              <AppLogo href="/" size="sm" showWordmark />
              <Button
                ref={closeRef}
                type="button"
                variant="ghost"
                size="icon"
                aria-label="閉じる"
                onClick={() => setOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="flex-1 overflow-y-auto px-2 py-3">
              <ul className="space-y-1">
                {MENU_LINKS.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "block rounded-xl px-4 py-3.5 text-base font-medium",
                        "hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      )}
                      onClick={() => setOpen(false)}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
