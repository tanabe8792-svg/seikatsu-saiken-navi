"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Printer } from "lucide-react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { caseCardUrl } from "@/lib/case-management/case-access";
import { J00_DISASTER_EVENT_LABEL } from "@/lib/j00-hearing";
import type { CaseFile } from "@/lib/case-management/types";

interface CaseAccessCardProps {
  caseFile: CaseFile;
  /** 印刷レイアウトを強調 */
  printMode?: boolean;
}

/**
 * 高齢者・窓口向け — 公開ケース番号と回復コードを紙に残すカード
 * QR のサーバー開封は P1。今は番号＋URL で運用開始できる。
 */
export function CaseAccessCard({
  caseFile,
  printMode = false,
}: CaseAccessCardProps) {
  const publicId = caseFile.publicCaseId ?? "（未採番）";
  const recovery = caseFile.recoveryCode ?? "（未採番）";
  const url = caseFile.publicCaseId
    ? caseCardUrl(caseFile.publicCaseId)
    : "";
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!url) {
      setQrDataUrl(null);
      return;
    }
    let cancelled = false;
    void QRCode.toDataURL(url, {
      width: 180,
      margin: 1,
      errorCorrectionLevel: "M",
    }).then((dataUrl) => {
      if (!cancelled) setQrDataUrl(dataUrl);
    });
    return () => {
      cancelled = true;
    };
  }, [url]);

  return (
    <Card
      className={
        printMode
          ? "border-2 border-foreground bg-white text-foreground shadow-none"
          : "border-border bg-card"
      }
    >
      <CardContent className="space-y-4 p-5">
        <div className="space-y-1">
          <p className="text-xs font-medium tracking-wide text-muted-foreground">
            生活再建ナビ · ケースカード
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {J00_DISASTER_EVENT_LABEL}
          </p>
        </div>

        <div className="rounded-xl border bg-background px-4 py-4 text-center">
          <p className="text-xs text-muted-foreground">ケース番号</p>
          <p className="mt-1 font-mono text-2xl font-bold tracking-wider">
            {publicId}
          </p>
        </div>

        <div className="rounded-xl border border-dashed bg-background px-4 py-3 text-center">
          <p className="text-xs text-muted-foreground">回復コード（大切に保管）</p>
          <p className="mt-1 font-mono text-lg font-semibold tracking-wider">
            {recovery}
          </p>
        </div>

        {qrDataUrl && (
          <div className="flex flex-col items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrDataUrl}
              alt={`ケース ${publicId} のQRコード`}
              width={180}
              height={180}
              className="rounded-md border bg-white p-2"
            />
            <p className="max-w-xs text-center text-xs leading-relaxed text-muted-foreground">
              窓口や家族が読み取ると、このケースの案内ページが開きます。
              機微情報の表示には、今後の認証が必要です。
            </p>
          </div>
        )}

        <ul className="space-y-1.5 text-sm leading-relaxed text-muted-foreground">
          <li>・この紙を持っておけば、ログインしなくても窓口でケースを伝えられます。</li>
          <li>・番号やコードを他人に見せすぎないでください。</li>
          <li>・なくしたときは、市役所等で本人確認のうえ再発行できます（準備中）。</li>
        </ul>

        {!printMode && (
          <Button asChild variant="outline" className="h-11 w-full">
            <Link href="/mypage/case-card">
              <Printer className="h-4 w-4" />
              印刷用ページを開く
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
