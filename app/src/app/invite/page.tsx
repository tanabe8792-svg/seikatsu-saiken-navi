"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  isValidInviteCode,
  normalizeInviteCode,
} from "@/lib/case-management/case-sharing";

/** 招待コード手入力の入口（/invite/---- の代わり） */
export default function InviteIndexPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleContinue() {
    const normalized = normalizeInviteCode(code);
    if (!isValidInviteCode(normalized)) {
      setError("招待コードの形式を確認してください（例: ABCD-EFGH）。");
      return;
    }
    router.push(`/invite/${encodeURIComponent(normalized)}`);
  }

  return (
    <>
      <SiteHeader title="招待コード" showBack backHref="/mypage" />
      <main className="space-y-4 px-4 py-6 pb-28">
        <Card>
          <CardContent className="space-y-4 p-5">
            <p className="text-sm leading-relaxed text-muted-foreground">
              家族などから受け取った招待コードを入力すると、そのケースに参加できます。
            </p>
            <Input
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setError(null);
              }}
              placeholder="ABCD-EFGH"
              className="font-mono tracking-wider"
              autoComplete="off"
            />
            <Button className="h-12 w-full" onClick={handleContinue}>
              次へ
            </Button>
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
