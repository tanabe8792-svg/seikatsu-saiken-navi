"use client";

import { Check, Link2, MessageCircle, Share2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/providers/toast-provider";
import { cn } from "@/lib/utils";

const DEFAULT_SHARE_URL = "https://seikatsu-saiken-navi.vercel.app/";

export type ShareKind = "service" | "donation";

interface ShareActionsProps {
  kind?: ShareKind;
  /** 寄付後など。例: 500 / 1,000 / 自由 */
  amountLabel?: string;
  className?: string;
  compact?: boolean;
}

function buildSharePayload(kind: ShareKind, amountLabel?: string) {
  const url =
    kind === "donation"
      ? `${DEFAULT_SHARE_URL}about#support`
      : DEFAULT_SHARE_URL;
  const text =
    kind === "donation"
      ? amountLabel
        ? `生活再建ナビの活動費を応援しました（${amountLabel}）。熊本地震のあとの確認を、順番に整理する無料の案内です。`
        : `生活再建ナビの活動費を応援しました。熊本地震のあとの確認を、順番に整理する無料の案内です。`
      : `生活再建ナビ — 熊本地震のあとの「この先どうすればいいか」を、順番に整理する無料の案内です。`;
  return { url, text, title: "生活再建ナビ" };
}

/**
 * サービス紹介・寄付後の拡散用（Web Share / LINE / コピー）
 * サーバーには送らない。端末の共有シートのみ。
 */
export function ShareActions({
  kind = "service",
  amountLabel,
  className,
  compact = false,
}: ShareActionsProps) {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);
  const payload = buildSharePayload(kind, amountLabel);

  async function shareNative() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: payload.title,
          text: payload.text,
          url: payload.url,
        });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      }
    }
    await copyLink();
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${payload.text}\n${payload.url}`);
      setCopied(true);
      showToast("共有用の文とリンクをコピーしました");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast("コピーできませんでした。リンクを長押ししてコピーしてください。");
    }
  }

  function shareLine() {
    const lineUrl = `https://line.me/R/msg/text/?${encodeURIComponent(
      `${payload.text}\n${payload.url}`
    )}`;
    window.open(lineUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <div className={cn("space-y-3", className)}>
      {!compact ? (
        <p className="text-sm leading-relaxed text-muted-foreground">
          {kind === "donation"
            ? "応援したことをSNSやLINEで伝えると、ほかの方にもこの案内が届きやすくなります（任意です）。"
            : "この案内を家族や知人に伝えると、必要な方に届きやすくなります（任意です）。"}
        </p>
      ) : null}
      <div className="grid gap-2 sm:grid-cols-3">
        <Button
          type="button"
          className="h-11 w-full"
          onClick={() => void shareNative()}
        >
          <Share2 className="h-4 w-4" />
          共有する
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full"
          onClick={shareLine}
        >
          <MessageCircle className="h-4 w-4" />
          LINEで送る
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full"
          onClick={() => void copyLink()}
        >
          {copied ? (
            <Check className="h-4 w-4 text-brand-green" />
          ) : (
            <Link2 className="h-4 w-4" />
          )}
          {copied ? "コピー済み" : "文をコピー"}
        </Button>
      </div>
    </div>
  );
}
