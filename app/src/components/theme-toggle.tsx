"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

/** ヘッダー用のアイコン切替（設定へ移したため、互換用に残す） */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative"
      aria-label="テーマ切替"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );
}

/** 設定画面用：明るい／暗いを明示的に選ぶ */
export function ThemeToggleButtons() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const current = theme === "system" ? resolvedTheme : theme;

  return (
    <div className="grid grid-cols-2 gap-2">
      <Button
        type="button"
        variant={current === "light" ? "default" : "outline"}
        className="h-14 gap-2 text-base"
        onClick={() => setTheme("light")}
      >
        <Sun className="h-5 w-5" />
        明るい
      </Button>
      <Button
        type="button"
        variant={current === "dark" ? "default" : "outline"}
        className="h-14 gap-2 text-base"
        onClick={() => setTheme("dark")}
      >
        <Moon className="h-5 w-5" />
        暗い
      </Button>
    </div>
  );
}
