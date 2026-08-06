import Link from "next/link";
import { ExternalLink, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  formatOfficialLineBasicId,
  getOfficialLineAddFriendUrl,
} from "@/lib/line/official-account";

interface OfficialLineFriendCardProps {
  compact?: boolean;
}

export function OfficialLineFriendCard({ compact = false }: OfficialLineFriendCardProps) {
  const lineId = formatOfficialLineBasicId();
  const addUrl = getOfficialLineAddFriendUrl();

  if (compact) {
    return (
      <Button asChild variant="outline" className="h-12 w-full">
        <a href={addUrl} target="_blank" rel="noopener noreferrer">
          <MessageCircle className="h-5 w-5" />
          公式LINEを友だち追加（{lineId}）
          <ExternalLink className="h-4 w-4 opacity-60" />
        </a>
      </Button>
    );
  }

  return (
    <Card className="border-border bg-card">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start gap-3">
          <MessageCircle className="mt-0.5 h-6 w-6 shrink-0 text-brand-green" />
          <div className="space-y-2">
            <h2 className="text-lg font-bold">公式LINE</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              最新の支援案内などをLINEで受け取るには、まず公式アカウントを友だち追加してください。
            </p>
            <p className="text-xs text-muted-foreground">
              ID: <span className="font-medium text-foreground">{lineId}</span>
            </p>
          </div>
        </div>
        <Button asChild size="lg" className="h-12 w-full">
          <a href={addUrl} target="_blank" rel="noopener noreferrer">
            公式LINEを友だち追加する
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
        <p className="text-xs leading-relaxed text-muted-foreground">
          友だち追加後、設定の「マイページ登録」でLINE通知を選んで保存してください。配信の自動連携は順次準備中です。
        </p>
        <Link
          href="/settings#mypage-register"
          className="inline-block text-sm font-medium text-primary underline-offset-2 hover:underline"
        >
          マイページ登録の設定へ
        </Link>
      </CardContent>
    </Card>
  );
}
