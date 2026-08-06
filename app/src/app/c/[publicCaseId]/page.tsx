"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { IdentityRegistrationPanel } from "@/components/auth/identity-registration-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  CASE_ACCESS_LEVEL_LABELS,
  OPERATIONAL_CASE_STATUS_LABELS,
  type OperationalCaseStatus,
} from "@/lib/case-management/case-sharing";
import { saveLocalCaseShare } from "@/lib/case-management/case-share-storage";
import {
  isValidPublicCaseId,
  normalizePublicCaseId,
  ensureCaseAccessCodes,
} from "@/lib/case-management/case-access";
import type { CaseFile } from "@/lib/case-management/types";
import { getCaseByPublicId } from "@/lib/supabase/cases";
import { useAuth } from "@/providers/auth-provider";
import { useUserSession } from "@/hooks/use-user-session";
import { Suspense } from "react";

/**
 * P2 入口: QR / ケース番号は「入口」のみ。
 * 閲覧にはログイン + ケース権限が必須。
 */
export default function PublicCasePage() {
  const params = useParams();
  const raw = typeof params.publicCaseId === "string" ? params.publicCaseId : "";
  const publicId = normalizePublicCaseId(decodeURIComponent(raw));
  const valid = isValidPublicCaseId(publicId);
  const { identity, loading: authLoading } = useAuth();
  const { session, setCaseFile, loading: sessionLoading } = useUserSession();
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [opened, setOpened] = useState<{
    accessLevel: "view" | "edit";
    caseStatus?: string;
  } | null>(null);

  const localMatch =
    session.caseFile?.publicCaseId &&
    normalizePublicCaseId(session.caseFile.publicCaseId) === publicId;

  useEffect(() => {
    if (!valid || !identity || authLoading) return;

    let cancelled = false;
    async function openIfMember() {
      setChecking(true);
      setError(null);
      const result = await getCaseByPublicId(publicId);
      if (cancelled) return;
      setChecking(false);

      if (!result.ok) {
        setError(result.message);
        return;
      }
      if (!result.found) {
        setOpened(null);
        return;
      }

      if (result.caseFile && typeof result.caseFile === "object") {
        setCaseFile(ensureCaseAccessCodes(result.caseFile as CaseFile));
      }
      saveLocalCaseShare({
        remoteCaseId: result.caseId,
        publicCaseId: result.publicCaseId,
        accessLevel: result.accessLevel,
        role: result.role,
        isOwner: result.role === "owner",
      });
      setOpened({
        accessLevel: result.accessLevel,
        caseStatus: result.caseStatus,
      });
    }

    void openIfMember();
    return () => {
      cancelled = true;
    };
  }, [valid, identity, authLoading, publicId, setCaseFile]);

  return (
    <>
      <SiteHeader title="ケース案内" showBack backHref="/" />
      <main className="space-y-4 px-4 py-6 pb-28">
        <Card>
          <CardContent className="space-y-3 p-5">
            <p className="text-sm text-muted-foreground">ケース番号</p>
            <p className="font-mono text-xl font-bold tracking-wider">
              {valid ? publicId : "形式が正しくありません"}
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              QRコードやケース番号だけでは内容は表示されません。ログインし、共有権限がある場合のみ開けます。
            </p>
          </CardContent>
        </Card>

        {authLoading || sessionLoading || checking ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        ) : !identity ? (
          <Suspense
            fallback={
              <p className="text-center text-sm text-muted-foreground">
                読み込み中…
              </p>
            }
          >
            <IdentityRegistrationPanel
              defaultMode="login"
              title="続けるにはログイン"
              afterLoginHref={`/c/${encodeURIComponent(publicId)}`}
              afterLoginLabel="ログイン後、ケースを開く"
            />
          </Suspense>
        ) : opened ? (
          <Card>
            <CardContent className="space-y-3 p-5">
              <p className="font-medium text-brand-green">ケースを開けました</p>
              <p className="text-sm text-muted-foreground">
                権限: {CASE_ACCESS_LEVEL_LABELS[opened.accessLevel]}
                {opened.caseStatus &&
                opened.caseStatus in OPERATIONAL_CASE_STATUS_LABELS
                  ? ` · ${OPERATIONAL_CASE_STATUS_LABELS[opened.caseStatus as OperationalCaseStatus]}`
                  : ""}
              </p>
              <Button asChild className="h-12 w-full">
                <Link href="/mypage">マイページで内容を見る</Link>
              </Button>
              <Button asChild variant="outline" className="h-12 w-full">
                <Link href="/actions">やること一覧</Link>
              </Button>
            </CardContent>
          </Card>
        ) : localMatch ? (
          <Card>
            <CardContent className="space-y-3 p-5">
              <p className="text-sm leading-relaxed">
                この端末に、同じケース番号の記録があります（クラウド共有の権限はまだ確認できませんでした）。
              </p>
              <Button asChild className="h-12 w-full">
                <Link href="/mypage">マイページで内容を見る</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="space-y-3 p-5">
              <p className="text-sm leading-relaxed text-muted-foreground">
                ログイン中ですが、このケースを開く権限がありません。所有者から招待リンクまたは招待コードをもらって参加してください。
              </p>
              <Button asChild variant="outline" className="h-12 w-full">
                <Link href="/invite">招待コードで参加</Link>
              </Button>
              {error && (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </>
  );
}
