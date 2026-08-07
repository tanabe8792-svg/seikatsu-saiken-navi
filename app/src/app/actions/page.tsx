"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { IdentityRegisterPrompt } from "@/components/auth/identity-status-chip";
import { CaseActionsDashboard } from "@/components/actions/case-actions-dashboard";
import { FontSizeQuickControl } from "@/components/settings/font-size-quick-control";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  formatCaseSituation,
  getCurrentAction,
} from "@/lib/case-management/action-queue";
import { getCaseActionDetailPath } from "@/lib/navigation";
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
              まず、お住まいの地域と被害の状況をお聞きします（約2分）。そのあと、確認することを順番に案内します。
            </p>
          </div>
          <Button asChild size="lg" className="h-14 w-full text-lg">
            <Link href="/start">状況を選んで案内を作る</Link>
          </Button>
        </main>
      </>
    );
  }

  const situation = formatCaseSituation(caseFile);
  const current = getCurrentAction(caseFile);

  return (
    <>
      <SiteHeader title="やること" />
      <main className="space-y-4 px-4 py-4">
        <FontSizeQuickControl className="mx-0" />
        {showWelcome && (
          <Card className="border-emerald-300/60 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/20">
            <CardContent className="space-y-3 p-5">
              <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                状況を整理しました
              </p>
              {situation !== "状況確認中" && (
                <p className="text-base font-semibold">{situation}</p>
              )}
              <p className="text-sm leading-relaxed text-muted-foreground">
                オレンジ色の「いま確認する」から進めてください。一覧を先に見ても大丈夫です。
              </p>
              {current && (
                <Button asChild size="lg" className="h-12 w-full">
                  <Link href={getCaseActionDetailPath(current.id)}>
                    ここから進む
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        )}
        <IdentityRegisterPrompt />
        <CaseActionsDashboard caseFile={caseFile} />
      </main>
    </>
  );
}
