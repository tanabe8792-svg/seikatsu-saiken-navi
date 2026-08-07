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
 * 高齢者・紙運用向け — 公開ケース番号と回復コード
 * ※ 行政と連携した再発行は未対応。誤解を招かない文言にする。
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
            熊本 生活再建ナビ · 記録カード
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {J00_DISASTER_EVENT_LABEL}
          </p>
        </div>

        <div className="rounded-xl border bg-background px-4 py-4 text-center">
          <p className="text-xs text-muted-foreground">記録番号</p>
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
              alt={`記録 ${publicId} のQRコード`}
              width={180}
              height={180}
              className="rounded-md border bg-white p-2"
            />
            <p className="max-w-xs text-center text-xs leading-relaxed text-muted-foreground">
              QRは記録番号を開くためのものです。中身を見るにはログインと、家族からの招待が必要です。
            </p>
          </div>
        )}

        <ul className="space-y-1.5 text-sm leading-relaxed text-muted-foreground">
          <li>・ログインしていなくても、この端末にデータが残っている間は同じ番号です。</li>
          <li>
            ・「データをリセット」やブラウザのデータを消すと、番号も新しくなります（最初からになります）。
          </li>
          <li>・紙に印刷して保管してください。番号やコードを、必要のない人に見せすぎないでください。</li>
          <li>・なくした場合は、印刷した紙を使うか、家族に招待を送ってもらってください。</li>
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
