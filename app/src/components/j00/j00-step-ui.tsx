"use client";

import { cn } from "@/lib/utils";

export function StepProgress({
  step,
  total,
}: {
  step: number;
  total: number;
}) {
  return (
    <div className="space-y-2">
      <p className="text-base text-muted-foreground">
        タップするだけ。{step}/{total}
      </p>
      <div className="flex items-center gap-2">
        {Array.from({ length: total }, (_, i) => i + 1).map((s) => (
          <div
            key={s}
            className={cn(
              "h-2 flex-1 rounded-full transition-colors",
              s <= step ? "bg-primary" : "bg-secondary"
            )}
          />
        ))}
      </div>
    </div>
  );
}

export function ChoiceList({
  title,
  subtitle,
  options,
  selected,
  onSelect,
}: {
  title: string;
  subtitle?: string;
  options: string[];
  selected?: string;
  onSelect: (value: string) => void;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-xl font-bold leading-snug">{title}</h2>
        {subtitle && (
          <p className="mt-1 text-base text-muted-foreground">{subtitle}</p>
        )}
      </div>
      <div className="space-y-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onSelect(option)}
            className={cn(
              "flex min-h-[56px] w-full items-center rounded-2xl border-2 px-5 py-4 text-left text-lg font-medium transition-colors active:scale-[0.98]",
              selected === option
                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                : "border-border bg-card hover:border-brand-green/40 hover:bg-muted/50"
            )}
          >
            {option}
          </button>
        ))}
      </div>
    </section>
  );
}

export function MultiToggleList({
  title,
  subtitle,
  options,
  selectedKeys,
  onToggle,
}: {
  title: string;
  subtitle?: string;
  options: { key: string; label: string }[];
  selectedKeys: Set<string>;
  onToggle: (key: string) => void;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-xl font-bold leading-snug">{title}</h2>
        {subtitle && (
          <p className="mt-1 text-base text-muted-foreground">{subtitle}</p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {options.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => onToggle(key)}
            className={cn(
              "min-h-[56px] rounded-2xl border-2 px-4 py-3 text-base font-medium transition-colors active:scale-[0.98]",
              selectedKeys.has(key)
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card hover:border-brand-green/40"
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </section>
  );
}

export function YesNoRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean | undefined;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3">
      <span className="text-lg font-medium">{label}</span>
      <div className="flex gap-2">
        {(
          [
            { v: true, l: "あり" },
            { v: false, l: "なし" },
          ] as const
        ).map(({ v, l }) => (
          <button
            key={l}
            type="button"
            onClick={() => onChange(v)}
            className={cn(
              "min-h-[44px] min-w-[72px] rounded-xl border-2 px-4 text-base font-semibold transition-colors",
              value === v
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background"
            )}
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}
