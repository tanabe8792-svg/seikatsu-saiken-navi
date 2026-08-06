"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/auth-provider";

/**
 * マイページ登録・ログイン完了後に大きく「できた」と見せる。
 * （ログイン済みだと登録パネルが消えるため、別コンポーネントで表示する）
 */
export function RegistrationCompleteBanner() {
  const { identity, identityLabel, refresh } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const verified = searchParams.get("verified");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!verified) return;
    setVisible(true);
    void refresh();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [verified, refresh]);

  if (!visible || !identity || !verified) return null;

  const viaLine = verified === "line";
  const viaEmail = verified === "email";

  function dismiss() {
    setVisible(false);
    const next = new URLSearchParams(searchParams.toString());
    next.delete("verified");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div
      className="space-y-4 rounded-2xl border-2 border-emerald-400 bg-emerald-50 px-5 py-6 dark:border-emerald-700 dark:bg-emerald-950/40"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 h-9 w-9 shrink-0 text-emerald-700 dark:text-emerald-300" />
        <div className="space-y-2">
          <p className="text-xl font-bold text-emerald-950 dark:text-emerald-50">
            マイページ登録が完了しました
          </p>
          <p className="text-sm leading-relaxed text-emerald-900 dark:text-emerald-100">
            {viaLine
              ? "LINEでの登録・ログインが完了しました。"
              : viaEmail
                ? "メールでの登録・ログインが完了しました。"
                : "登録・ログインが完了しました。"}
            {identityLabel ? `（${identityLabel}）` : ""}
          </p>
          <p className="text-sm leading-relaxed text-emerald-900 dark:text-emerald-100">
            ここがマイページです。下に、保存した状況や進捗が表示されます。登録は完了しているので、もう一度メールやLINEの手続きをする必要はありません。
          </p>
        </div>
      </div>
      <Button
        type="button"
        className="h-12 w-full bg-emerald-700 text-white hover:bg-emerald-800"
        onClick={dismiss}
      >
        内容を確認する
      </Button>
    </div>
  );
}
