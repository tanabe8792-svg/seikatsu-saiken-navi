"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { IdentityRegistrationPanel } from "@/components/auth/identity-registration-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  CASE_ACCESS_LEVEL_LABELS,
  isValidInviteCode,
  normalizeInviteCode,
} from "@/lib/case-management/case-sharing";
import { saveLocalCaseShare } from "@/lib/case-management/case-share-storage";
import type { CaseFile } from "@/lib/case-management/types";
import { ensureCaseAccessCodes } from "@/lib/case-management/case-access";
import { acceptFamilyInvite } from "@/lib/supabase/cases";
import { useAuth } from "@/providers/auth-provider";
import { useUserSession } from "@/hooks/use-user-session";

function InviteAcceptInner() {
  const params = useParams();
  const router = useRouter();
  const rawParam =
    typeof params.code === "string" ? decodeURIComponent(params.code) : "";
  const { identity, loading: authLoading } = useAuth();
  const { setCaseFile } = useUserSession();

  const [code, setCode] = useState(normalizeInviteCode(rawParam));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{
    publicCaseId: string;
    accessLevel: "view" | "edit";
  } | null>(null);

  useEffect(() => {
    if (rawParam) setCode(normalizeInviteCode(rawParam));
  }, [rawParam]);

  async function handleAccept() {
    const normalized = normalizeInviteCode(code);
    if (!isValidInviteCode(normalized)) {
      setError("招待コードの形式を確認してください（例: ABCD-EFGH）。");
      return;
    }
    if (!identity) {
      setError("先にログインしてください。");
      return;
    }

    setBusy(true);
    setError(null);
    const result = await acceptFamilyInvite(normalized);
    setBusy(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    const rawFile = result.result.caseFile;
    if (rawFile && typeof rawFile === "object") {
      const ensured = ensureCaseAccessCodes(rawFile as CaseFile);
      setCaseFile(ensured);
    }

    saveLocalCaseShare({
      remoteCaseId: result.result.caseId,
      publicCaseId: result.result.publicCaseId,
      accessLevel: result.result.accessLevel,
      role: result.result.role,
      isOwner: false,
    });

    setDone({
      publicCaseId: result.result.publicCaseId,
      accessLevel: result.result.accessLevel,
    });
  }

  if (authLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <main className="space-y-5 px-4 py-6 pb-28">
      <Card>
        <CardContent className="space-y-4 p-5">
          <h1 className="text-lg font-bold">家族からの招待</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            家族などから渡された、生活再建の案内の続きに参加します。相手のログイン情報は不要です。あなた自身のメールまたはLINEでログインしてから参加してください。
          </p>

          <label className="block space-y-2 text-sm font-medium">
            招待コード
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ABCD-EFGH"
              autoComplete="off"
              className="font-mono tracking-wider"
            />
          </label>
        </CardContent>
      </Card>

      {!identity ? (
        <Suspense
          fallback={
            <p className="text-center text-sm text-muted-foreground">読み込み中…</p>
          }
        >
          <IdentityRegistrationPanel
            defaultMode="login"
            title="参加するためにログイン"
            afterLoginHref={`/invite/${encodeURIComponent(normalizeInviteCode(code) || rawParam)}`}
            afterLoginLabel="ログイン後、このページで参加する"
          />
        </Suspense>
      ) : done ? (
        <Card>
          <CardContent className="space-y-4 p-5">
            <p className="font-medium text-brand-green">参加できました</p>
            <p className="text-sm text-muted-foreground">
              記録番号 {done.publicCaseId} ／{" "}
              {CASE_ACCESS_LEVEL_LABELS[done.accessLevel]}
            </p>
            <Button
              className="h-12 w-full"
              onClick={() => router.push("/mypage")}
            >
              マイページで内容を見る
            </Button>
            <Button asChild variant="outline" className="h-12 w-full">
              <Link href="/actions">やること一覧へ</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <Button
            className="h-12 w-full"
            disabled={busy}
            onClick={() => void handleAccept()}
          >
            {busy ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              "この案内に参加する"
            )}
          </Button>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </div>
      )}
    </main>
  );
}

export default function InvitePage() {
  return (
    <>
      <SiteHeader title="招待" showBack backHref="/mypage" />
      <Suspense
        fallback={
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        }
      >
        <InviteAcceptInner />
      </Suspense>
    </>
  );
}
