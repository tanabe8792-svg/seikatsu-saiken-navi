"use client";

import { useCallback, useEffect, useState } from "react";
import { Copy, Link2, Loader2, Share2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CASE_ACCESS_LEVEL_LABELS,
  familyInviteUrl,
  type CaseAccessLevel,
} from "@/lib/case-management/case-sharing";
import {
  loadLocalCaseShare,
  saveLocalCaseShare,
} from "@/lib/case-management/case-share-storage";
import type { CaseFile } from "@/lib/case-management/types";
import { useAuth } from "@/providers/auth-provider";
import {
  createFamilyInvite,
  listMyCaseMemberships,
  publishOwnedCase,
} from "@/lib/supabase/cases";

interface CaseSharePanelProps {
  caseFile: CaseFile;
}

export function CaseSharePanel({ caseFile }: CaseSharePanelProps) {
  const { identity, loading: authLoading } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessLevel, setAccessLevel] = useState<CaseAccessLevel>("edit");
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [copied, setCopied] = useState<"code" | "url" | null>(null);
  const [membershipNote, setMembershipNote] = useState<string | null>(null);

  const refreshMembershipHint = useCallback(async () => {
    if (!identity) return;
    const result = await listMyCaseMemberships();
    if (!result.ok) return;
    const mine = result.items.find(
      (item) =>
        item.publicCaseId === caseFile.publicCaseId ||
        item.role === "owner"
    );
    if (mine && mine.role !== "owner") {
      setMembershipNote(
        `共有ケースに「${CASE_ACCESS_LEVEL_LABELS[mine.accessLevel]}」で参加中です（${mine.publicCaseId}）。`
      );
    }
  }, [identity, caseFile.publicCaseId]);

  useEffect(() => {
    void refreshMembershipHint();
  }, [refreshMembershipHint]);

  if (authLoading) return null;

  if (!identity) {
    return (
      <Card className="border-border">
        <CardContent className="space-y-2 p-5 text-sm leading-relaxed text-muted-foreground">
          <p className="font-medium text-foreground">家族にケースを共有する</p>
          <p>
            家族などが代わりに進めるには、先にメールまたはLINEでログインしてください。
            アカウントを共有するのではなく、このケースへの招待を送ります。
          </p>
        </CardContent>
      </Card>
    );
  }

  async function handleCreateInvite() {
    if (!caseFile.publicCaseId) {
      setError("ケース番号の準備ができていません。画面を再読み込みしてください。");
      return;
    }
    setBusy(true);
    setError(null);
    setInviteCode(null);
    setInviteUrl(null);

    const published = await publishOwnedCase({
      publicCaseId: caseFile.publicCaseId,
      internalCaseId: caseFile.caseId,
      caseFile,
      municipalityCode: caseFile.municipalityCode,
    });

    if (!published.ok) {
      setBusy(false);
      setError(published.message);
      return;
    }

    saveLocalCaseShare({
      remoteCaseId: published.caseId,
      publicCaseId: caseFile.publicCaseId,
      accessLevel: "edit",
      role: "owner",
      isOwner: true,
    });

    const invited = await createFamilyInvite({
      caseId: published.caseId,
      accessLevel,
    });
    setBusy(false);

    if (!invited.ok) {
      setError(invited.message);
      return;
    }

    setInviteCode(invited.inviteCode);
    setInviteUrl(familyInviteUrl(invited.inviteCode));
    setExpiresAt(invited.expiresAt);
  }

  async function copyText(kind: "code" | "url", value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      setError("コピーできませんでした。長い押しで選択してください。");
    }
  }

  const existing = loadLocalCaseShare();

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Share2 className="h-5 w-5 text-brand-green" />
          家族・代理人を招待
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-relaxed text-muted-foreground">
          ログイン用のIDやパスワードを教え合う必要はありません。招待リンクまたは招待コードで、このケースだけを共有できます。
        </p>

        {membershipNote && (
          <p className="rounded-lg border bg-muted/40 px-3 py-2 text-sm">
            {membershipNote}
          </p>
        )}

        {existing?.isOwner && (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            共有の準備済み（ケース {existing.publicCaseId}）
          </p>
        )}

        <div className="space-y-2">
          <p className="text-sm font-medium">相手に許可する内容</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className={
                accessLevel === "view"
                  ? "rounded-xl border border-brand-green bg-muted/50 px-3 py-3 text-sm font-medium ring-1 ring-brand-green/20"
                  : "rounded-xl border border-border px-3 py-3 text-sm"
              }
              onClick={() => setAccessLevel("view")}
            >
              閲覧のみ
            </button>
            <button
              type="button"
              className={
                accessLevel === "edit"
                  ? "rounded-xl border border-brand-green bg-muted/50 px-3 py-3 text-sm font-medium ring-1 ring-brand-green/20"
                  : "rounded-xl border border-border px-3 py-3 text-sm"
              }
              onClick={() => setAccessLevel("edit")}
            >
              編集可
            </button>
          </div>
        </div>

        <Button
          type="button"
          className="h-12 w-full"
          disabled={busy}
          onClick={() => void handleCreateInvite()}
        >
          {busy ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <Link2 className="h-4 w-4" />
              招待リンク・コードを作成
            </>
          )}
        </Button>

        {inviteCode && inviteUrl && (
          <div className="space-y-3 rounded-xl border bg-background px-4 py-4">
            <div>
              <p className="text-xs text-muted-foreground">招待コード</p>
              <p className="mt-1 font-mono text-xl font-bold tracking-wider">
                {inviteCode}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => void copyText("code", inviteCode)}
              >
                <Copy className="h-3.5 w-3.5" />
                {copied === "code" ? "コピーしました" : "コードをコピー"}
              </Button>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">招待リンク</p>
              <p className="mt-1 break-all text-sm">{inviteUrl}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => void copyText("url", inviteUrl)}
              >
                <Copy className="h-3.5 w-3.5" />
                {copied === "url" ? "コピーしました" : "リンクをコピー"}
              </Button>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              権限: {CASE_ACCESS_LEVEL_LABELS[accessLevel]}
              {expiresAt
                ? ` · 有効期限 ${new Date(expiresAt).toLocaleDateString("ja-JP")}`
                : ""}
            </p>
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
