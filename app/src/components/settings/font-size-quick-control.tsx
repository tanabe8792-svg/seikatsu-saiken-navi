"use client";

import { Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FONT_SIZE_LABELS, type FontSize } from "@/lib/settings";
import { useSettings } from "@/providers/settings-provider";
import { cn } from "@/lib/utils";

const FONT_OPTIONS: FontSize[] = ["normal", "large", "xlarge"];

interface FontSizeQuickControlProps {
  className?: string;
  /** ランディング用 — 説明文を大きめに */
  prominent?: boolean;
}

export function FontSizeQuickControl({
  className,
  prominent = false,
}: FontSizeQuickControlProps) {
  const { settings, setFontSize } = useSettings();
  const current = settings.fontSize;

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card",
        prominent ? "px-4 py-4" : "px-3 py-3",
        className
      )}
      role="group"
      aria-label="文字サイズ"
    >
      <div className="flex items-center gap-2">
        <Type
          className={cn(
            "shrink-0 text-brand-green",
            prominent ? "h-5 w-5" : "h-4 w-4"
          )}
          aria-hidden
        />
        <p
          className={cn(
            "font-medium",
            prominent ? "text-base" : "text-sm"
          )}
        >
          文字サイズ
        </p>
      </div>
      <p
        className={cn(
          "mt-1.5 leading-relaxed text-muted-foreground",
          prominent ? "text-sm" : "text-xs"
        )}
      >
        見えにくいときは「大きい」か「もっと大きい」を押してください。
      </p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {FONT_OPTIONS.map((size) => {
          const active = current === size;
          return (
            <Button
              key={size}
              type="button"
              variant={active ? "default" : "outline"}
              className={cn(
                "h-auto min-h-[3rem] py-2.5",
                prominent && "text-base",
                prominent && size === "large" && !active && "border-brand-green/40"
              )}
              aria-pressed={active}
              onClick={() => setFontSize(size)}
            >
              <span className="font-semibold">{FONT_SIZE_LABELS[size]}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
