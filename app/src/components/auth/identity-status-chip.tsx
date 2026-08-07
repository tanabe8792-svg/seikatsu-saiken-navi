"use client";

import Link from "next/link";
import { CheckCircle2, ChevronRight } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { cn } from "@/lib/utils";

interface IdentityStatusChipProps {
  className?: string;
  compact?: boolean;
}

/** ヘッダー等 — マイページ登録済みなら表示 */
export function IdentityStatusChip({
  className,
  compact = false,
}: IdentityStatusChipProps) {
  const { loading, identity, identityLabel } = useAuth();

  if (loading || !identity) return null;

  if (compact) {
    return (
      <Link
        href="/mypage"
        className={cn(
          "inline-flex max-w-[10rem] items-center gap-1 truncate rounded-full border border-brand-green/30 bg-muted/60 px-2.5 py-1 text-xs font-medium text-foreground",
          className
        )}
        title={identityLabel ?? undefined}
      >
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-brand-green" />
        <span className="truncate">登録済み</span>
      </Link>
    );
  }

  return (
    <Link
      href="/mypage"
      className={cn(
        "flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm transition-colors hover:bg-muted/50",
        className
      )}
    >
      <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-green" />
      <span className="min-w-0 truncate">{identityLabel}</span>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}

/** 各ページ用 — 未登録ならやわらかく案内 */
export function IdentityRegisterPrompt({ className }: { className?: string }) {
  const { loading, identity } = useAuth();

  if (loading || identity) return null;

  return (
    <Link
      href="/mypage"
      className={cn(
        "block rounded-2xl border-2 border-brand-green/30 bg-muted/40 px-5 py-4 transition-colors hover:bg-muted/70",
        className
      )}
    >
      <span className="text-lg font-bold text-foreground">
        あとで見返したい人へ（任意）
      </span>
      <span className="mt-2 block text-base leading-relaxed text-muted-foreground">
        メールまたはLINEで登録すると、別の日にも続きを開きやすくなります。登録しなくても案内は使えます。
      </span>
    </Link>
  );
}
