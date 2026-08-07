import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-bold">この画面は開けませんでした</h1>
      <p className="max-w-sm text-muted-foreground leading-relaxed">
        リンクが古い、またはまだ状況の整理が始まっていないことがあります。下の一覧から進めてください。
      </p>
      <div className="flex w-full max-w-sm flex-col gap-2">
        <Button asChild size="lg" className="h-12 w-full">
          <Link href="/actions">やること一覧へ</Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="h-12 w-full">
          <Link href="/">ホームへ</Link>
        </Button>
      </div>
    </main>
  );
}
