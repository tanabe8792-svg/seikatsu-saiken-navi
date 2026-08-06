"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function completeAuth() {
      if (!isSupabaseConfigured()) {
        setError("認証の設定が完了していません。");
        return;
      }

      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        setError("認証クライアントを初期化できませんでした。");
        return;
      }

      const next = searchParams.get("next") ?? "/settings";
      const code = searchParams.get("code");

      try {
        if (code) {
          const { error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            setError(exchangeError.message);
            return;
          }
        }

        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !data.session) {
          setError(
            "ログインを完了できませんでした。リンクの有効期限が切れている可能性があります。"
          );
          return;
        }

        router.replace(next.startsWith("/") ? next : "/settings");
      } catch {
        setError("ログイン処理中にエラーが発生しました。");
      }
    }

    void completeAuth();
  }, [router, searchParams]);

  return (
    <>
      <SiteHeader title="ログイン" showBack backHref="/settings" />
      <main className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 py-8">
        {!error ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
            <p className="text-center text-sm text-muted-foreground" role="status">
              マイページ登録を完了しています…
            </p>
          </>
        ) : (
          <>
            <p className="text-center text-sm text-destructive" role="alert">
              {error}
            </p>
            <Button asChild variant="outline">
              <a href="/settings#mypage-register">マイページ登録に戻る</a>
            </Button>
          </>
        )}
      </main>
    </>
  );
}
