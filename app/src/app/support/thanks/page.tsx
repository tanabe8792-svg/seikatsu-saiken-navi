"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { CheckCircle2 } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { ShareActions } from "@/components/about/share-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function amountLabelFromParams(raw: string | null): string | undefined {
  if (!raw) return undefined;
  const t = raw.trim();
  if (t === "custom" || t === "自由") return "自由な金額";
  if (/^\d+$/.test(t)) {
    return `${Number(t).toLocaleString("ja-JP")}円`;
  }
  return t;
}

function ThanksInner() {
  const searchParams = useSearchParams();
  const amountLabel = amountLabelFromParams(
    searchParams.get("amount") ?? searchParams.get("tier")
  );

  return (
    <main className="space-y-5 px-4 py-4 pb-28">
      <Card className="border-2 border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/40">
        <CardContent className="space-y-3 p-5">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-8 w-8 shrink-0 text-emerald-700 dark:text-emerald-300" />
            <div className="space-y-2">
              <h1 className="text-xl font-bold text-emerald-950 dark:text-emerald-50">
                ご支援ありがとうございます
              </h1>
              <p className="text-sm leading-relaxed text-emerald-900 dark:text-emerald-100">
                {amountLabel
                  ? `活動費（${amountLabel}）のご支援を受け付けました。開発・更新の力になります。`
                  : "活動費のご支援を受け付けました。開発・更新の力になります。"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-5">
          <h2 className="text-lg font-bold">応援したことを伝える（任意）</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            SNSやLINEで共有すると、同じ案内を必要としている方に届きやすくなります。金額を必ず書く必要はありません。文面は送る前に変えられます。
          </p>
          <ShareActions kind="donation" amountLabel={amountLabel} />
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2">
        <Button asChild size="lg" className="h-12 w-full">
          <Link href="/about#support">活動費の案内に戻る</Link>
        </Button>
        <Button asChild variant="outline" className="h-11 w-full">
          <Link href="/actions">やることに戻る</Link>
        </Button>
      </div>
    </main>
  );
}

export default function SupportThanksPage() {
  return (
    <>
      <SiteHeader title="ご支援ありがとう" showBack backHref="/about#support" />
      <Suspense
        fallback={
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            読み込み中…
          </p>
        }
      >
        <ThanksInner />
      </Suspense>
    </>
  );
}
