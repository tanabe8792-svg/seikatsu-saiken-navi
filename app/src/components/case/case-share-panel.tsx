"use client";

import { useCallback, useEffect, useState } from "react";
import { Copy, Link2, Loader2, Mail, MessageCircle, Share2, Users } from "lucide-react";
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
        `家族から渡された案内に、「${CASE_ACCESS_LEVEL_LABELS[mine.accessLevel]}」で参加しています（番号 ${mine.publicCaseId}）。`
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
          <p className="font-medium text-foreground">家族に続きを渡す</p>
          <p>
            家族が代わりに確認を進めるときは、先にメールまたはLINEでログインしてください。
            ログイン用の番号やパスワードを教え合う必要はありません。この記録への招待だけを送ります。
          </p>
        </CardContent>
      </Card>
    );
  }

  async function handleCreateInvite() {
    if (!caseFile.publicCaseId) {
      setError("記録番号の準備ができていません。画面を再読み込みしてください。");
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

  function buildInviteMessage(code: string, url: string): string {
    return [
      "熊本 生活再建ナビです。",
      "",
      "地震のあと、やることの確認を進めています。",
      "家族にも続きを見てもらえるよう、招待をお送りします。",
      "",
      "下のリンクを開くか、招待コードを入力してください。",
      `リンク: ${url}`,
      `招待コード: ${code}`,
      "",
      "あなた自身のメールまたはLINEでログインして参加できます。",
      "相手のログイン情報を教え合う必要はありません。",
      "無理のない範囲で大丈夫です。",
    ].join("\n");
  }

  function openMailShare(code: string, url: string) {
    const body = buildInviteMessage(code, url);
    const href = `mailto:?subject=${encodeURIComponent(
      "【熊本 生活再建ナビ】家族への招待"
    )}&body=${encodeURIComponent(body)}`;
    window.location.href = href;
  }

  function openLineShare(code: string, url: string) {
    const text = buildInviteMessage(code, url);
    const href = `https://line.me/R/msg/text/?${encodeURIComponent(text)}`;
    window.open(href, "_blank", "noopener,noreferrer");
  }

  async function openSystemShare(code: string, url: string) {
    const text = buildInviteMessage(code, url);
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "熊本 生活再建ナビ（家族への招待）",
          text,
          url,
        });
        return;
      } catch {
        // cancelled or unsupported — fall through
      }
    }
    await copyText("url", url);
  }

  const existing = loadLocalCaseShare();

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Share2 className="h-5 w-5 text-brand-green" />
          家族に続きを渡す
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-relaxed text-muted-foreground">
          ログイン用の番号やパスワードを教え合う必要はありません。招待リンクか招待コードで、この記録だけを渡せます。相手の負担にならないよう、必要なときだけ送ってください。
        </p>

        {membershipNote && (
          <p className="rounded-lg border bg-muted/40 px-3 py-2 text-sm">
            {membershipNote}
          </p>
        )}

        {existing?.isOwner && (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            共有の準備済み（番号 {existing.publicCaseId}）
          </p>
        )}

        <div className="space-y-2">
          <p className="text-sm font-medium">相手にできること</p>
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
              見るだけ
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
              書きかえもできる
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
              招待リンク・コードを作る
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

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <Button
                type="button"
                className="h-11 w-full"
                onClick={() => openMailShare(inviteCode, inviteUrl)}
              >
                <Mail className="h-4 w-4" />
                メールで送る
              </Button>
              <Button
                type="button"
                className="h-11 w-full"
                onClick={() => openLineShare(inviteCode, inviteUrl)}
              >
                <MessageCircle className="h-4 w-4" />
                LINEで送る
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full"
                onClick={() => void openSystemShare(inviteCode, inviteUrl)}
              >
                <Share2 className="h-4 w-4" />
                ほかの方法
              </Button>
            </div>

            <p className="text-xs leading-relaxed text-muted-foreground">
              相手にできること: {CASE_ACCESS_LEVEL_LABELS[accessLevel]}
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
