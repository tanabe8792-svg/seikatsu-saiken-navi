"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { CaseActionsDashboard } from "@/components/actions/case-actions-dashboard";
import { Button } from "@/components/ui/button";
import { useUserSession } from "@/hooks/use-user-session";

export default function ActionsPage() {
  const { session, loading } = useUserSession();
  const { caseFile } = session;

  if (loading) {
    return (
      <>
        <SiteHeader title="やること" />
        <div
          className="flex min-h-[60vh] items-center justify-center"
          role="status"
          aria-label="読み込み中"
        >
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </>
    );
  }

  if (!caseFile) {
    return (
      <>
        <SiteHeader title="やること" />
        <main className="space-y-5 px-4 py-8 pb-28">
          <div className="space-y-2 rounded-2xl border bg-card px-5 py-6">
            <p className="text-lg font-bold">まだ一覧がありません</p>
            <p className="text-base leading-relaxed text-muted-foreground">
              最初に、お住まいの地域や被害の状況をお聞きします。そのあと、確認することを順番に案内します。
            </p>
          </div>
          <Button asChild size="lg" className="h-14 w-full text-lg">
            <Link href="/start">はじめる</Link>
          </Button>
        </main>
      </>
    );
  }

  return (
    <>
      <SiteHeader title="やること" />
      <main className="px-4 py-4">
        <CaseActionsDashboard caseFile={caseFile} />
      </main>
    </>
  );
}
