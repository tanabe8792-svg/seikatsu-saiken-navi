"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, Loader2 } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/providers/auth-provider";
import { useUserSession } from "@/hooks/use-user-session";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useToast } from "@/providers/toast-provider";

const CONFIRM_WORD = "削除する";

export default function DeleteAccountPage() {
  const router = useRouter();
  const { identity, signOut } = useAuth();
  const { resetSession } = useUserSession();
  const { showToast } = useToast();
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  const canDelete =
    acknowledged && confirmText.trim() === CONFIRM_WORD && !busy;

  async function handleDelete() {
    if (!canDelete) return;
    setBusy(true);
    try {
      if (identity) {
        const supabase = getSupabaseBrowserClient();
        const session = supabase
          ? (await supabase.auth.getSession()).data.session
          : null;
        if (session?.access_token) {
          const res = await fetch("/api/account/delete", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          });
          const data = (await res.json().catch(() => ({}))) as {
            error?: string;
            localOnly?: boolean;
            ok?: boolean;
          };
          if (res.status === 501 || data.localOnly) {
            // 端末側の消去は続行
          } else if (!res.ok) {
            showToast(data.error ?? "アカウントの削除に失敗しました");
            setBusy(false);
            return;
          }
        }
        await signOut();
      }

      resetSession();
      showToast("アカウントと端末のデータを削除しました");
      router.replace("/start");
    } catch {
      showToast("削除処理中にエラーが起きました");
      setBusy(false);
    }
  }

  return (
    <>
      <SiteHeader title="アカウント削除" showBack backHref="/mypage" />
      <main className="space-y-5 px-4 py-4 pb-28">
        <Card className="border-2 border-destructive/40">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-7 w-7 shrink-0 text-destructive" />
              <div className="space-y-2">
                <h1 className="text-lg font-bold">本当に削除しますか？</h1>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  一度削除すると、<strong className="text-foreground">元に戻せません</strong>
                  。次のデータが消えます。
                </p>
              </div>
            </div>
            <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed">
              <li>この端末に保存した状況・進捗・写真</li>
              <li>記録番号や家族招待の参加状態（この端末分）</li>
              {identity ? (
                <li>マイページのログイン情報（メール／LINE）</li>
              ) : (
                <li>
                  いまはログインしていません。端末内のデータだけが消えます
                </li>
              )}
            </ul>
            <p className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm leading-relaxed text-amber-950 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-50">
              迷っているときは、下の「やめる」を押してください。削除しない方が安全です。
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-5">
            <label className="flex items-start gap-3 text-sm leading-relaxed">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 shrink-0"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
              />
              <span>
                削除は取り消せないこと、データが消えることを理解しました
              </span>
            </label>
            <div className="space-y-2">
              <label htmlFor="delete-confirm" className="text-sm font-medium">
                確認のため「{CONFIRM_WORD}」と入力してください
              </label>
              <Input
                id="delete-confirm"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={CONFIRM_WORD}
                autoComplete="off"
              />
            </div>
            <Button
              type="button"
              className="h-12 w-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={!canDelete}
              onClick={() => void handleDelete()}
            >
              {busy ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "アカウントとデータを削除する"
              )}
            </Button>
            <Button asChild variant="outline" className="h-12 w-full" disabled={busy}>
              <Link href="/mypage">やめる（削除しない）</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
