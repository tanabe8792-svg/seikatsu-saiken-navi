"use client";

import Link from "next/link";
import { Loader2, Printer } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { CaseAccessCard } from "@/components/case/case-access-card";
import { Button } from "@/components/ui/button";
import { useUserSession } from "@/hooks/use-user-session";

export default function CaseCardPrintPage() {
  const { session, loading } = useUserSession();
  const caseFile = session.caseFile;

  if (loading) {
    return (
      <>
        <SiteHeader title="記録カード" showBack backHref="/mypage" />
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </>
    );
  }

  if (!caseFile) {
    return (
      <>
        <SiteHeader title="記録カード" showBack backHref="/mypage" />
        <main className="space-y-4 px-4 py-6 pb-28">
          <p className="text-sm leading-relaxed text-muted-foreground">
            まだ記録がありません。質問を進めると、記録番号付きのカードを作れます。
          </p>
          <Button asChild className="h-12 w-full">
            <Link href="/start">質問をはじめる</Link>
          </Button>
        </main>
      </>
    );
  }

  return (
    <>
      <SiteHeader title="記録カード" showBack backHref="/mypage" />
      <main className="mx-auto max-w-md space-y-4 px-4 py-6 pb-28 print:max-w-none print:p-0">
        <p className="text-sm leading-relaxed text-muted-foreground print:hidden">
          印刷して紙で保管できます。高齢の方や、スマホが苦手な方の窓口提示用です。
        </p>
        <CaseAccessCard caseFile={caseFile} printMode />
        <Button
          type="button"
          className="h-12 w-full print:hidden"
          onClick={() => window.print()}
        >
          <Printer className="h-4 w-4" />
          印刷する
        </Button>
      </main>
    </>
  );
}
