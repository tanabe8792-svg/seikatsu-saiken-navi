"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-bold">問題が発生しました</h1>
      <p className="text-base text-muted-foreground">
        ページの表示中にエラーが起きました。もう一度お試しください。
      </p>
      <Button onClick={reset}>再読み込み</Button>
    </main>
  );
}
