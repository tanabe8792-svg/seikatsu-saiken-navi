"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  isValidPublicCaseId,
  normalizePublicCaseId,
} from "@/lib/case-management/case-access";
import { useUserSession } from "@/hooks/use-user-session";

/**
 * QR / 口頭の公開ケース番号の入口。
 * P1 でサーバー開封・職員トークンに拡張する。現状は同一端末の照合のみ。
 */
export default function PublicCasePage() {
  const params = useParams();
  const raw = typeof params.publicCaseId === "string" ? params.publicCaseId : "";
  const publicId = normalizePublicCaseId(decodeURIComponent(raw));
  const valid = isValidPublicCaseId(publicId);
  const { session, loading } = useUserSession();
  const localMatch =
    session.caseFile?.publicCaseId &&
    normalizePublicCaseId(session.caseFile.publicCaseId) === publicId;

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

            {loading ? (
              <p className="text-sm text-muted-foreground">確認中…</p>
            ) : localMatch ? (
              <>
                <p className="text-sm leading-relaxed">
                  この端末に、同じケースの記録があります。
                </p>
                <Button asChild className="h-12 w-full">
                  <Link href="/mypage">マイページで内容を見る</Link>
                </Button>
                <Button asChild variant="outline" className="h-12 w-full">
                  <Link href="/actions">やること一覧</Link>
                </Button>
              </>
            ) : (
              <>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  この番号のケースを、この端末ではまだ開けません。
                  今後、窓口や家族が安全に開ける仕組みを追加します。
                </p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>・本人の端末でログインしている場合はマイページへ</li>
                  <li>・紙の回復コードは、本人確認のある窓口で使います（準備中）</li>
                </ul>
                <Button asChild variant="outline" className="h-12 w-full">
                  <Link href="/mypage">ログイン・マイページへ</Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
