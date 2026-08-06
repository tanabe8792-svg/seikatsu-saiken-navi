"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { CaseActionsDashboard } from "@/components/actions/case-actions-dashboard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCaseSituation } from "@/lib/case-management/action-queue";
import { useUserSession } from "@/hooks/use-user-session";

export default function ActionsPage() {
  const { session, loading, dismissPostJ00Welcome } = useUserSession();
  const { caseFile } = session;
  const [showWelcome] = useState(() => session.showPostJ00Welcome === true);

  useEffect(() => {
    if (!session.showPostJ00Welcome) return;
    dismissPostJ00Welcome();
  }, [session.showPostJ00Welcome, dismissPostJ00Welcome]);

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

  const situation = formatCaseSituation(caseFile);

  return (
    <>
      <SiteHeader title="やること" />
      <main className="space-y-4 px-4 py-4">
        {showWelcome && (
          <Card className="border-emerald-300/60 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/20">
            <CardContent className="space-y-2 p-5">
              <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                状況を整理しました
              </p>
              {situation !== "状況確認中" && (
                <p className="text-base font-semibold">{situation}</p>
              )}
              <p className="text-sm leading-relaxed text-muted-foreground">
                下の一覧を一度眺めてから、確認したい項目の「詳しく確認する」を押してください。最初の項目は自動では開きません。
              </p>
            </CardContent>
          </Card>
        )}
        <CaseActionsDashboard caseFile={caseFile} />
      </main>
    </>
  );
}
