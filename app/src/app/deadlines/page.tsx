"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { DeadlinesDashboard } from "@/components/deadlines/deadlines-dashboard";
import { Button } from "@/components/ui/button";
import { useUserSession } from "@/hooks/use-user-session";

export default function DeadlinesPage() {
  const { session, loading } = useUserSession();
  const { caseFile } = session;

  if (loading) {
    return (
      <>
        <SiteHeader title="確認しておく期限" />
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
        <SiteHeader title="確認しておく期限" />
        <main className="space-y-5 px-4 py-8 pb-28">
          <div className="space-y-2 rounded-2xl border bg-card px-5 py-6">
            <p className="text-lg font-bold">まだ期限一覧がありません</p>
            <p className="text-base leading-relaxed text-muted-foreground">
              最初に状況をお聞きしたあと、関連する期限がここに表示されます。
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
      <SiteHeader title="確認しておく期限" />
      <main className="px-4 py-4">
        <DeadlinesDashboard caseFile={caseFile} />
      </main>
    </>
  );
}
