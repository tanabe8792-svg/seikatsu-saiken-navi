import { SiteHeader } from "@/components/layout/site-header";
import { Card, CardContent } from "@/components/ui/card";
import {
  formatFootprintDate,
  IMPROVEMENT_FOOTPRINTS,
} from "@/lib/trust/improvement-footprints";

export default function UpdatesPage() {
  return (
    <>
      <SiteHeader title="最近直したこと" showBack backHref="/mypage" />
      <main className="space-y-4 px-4 py-4 pb-28">
        <Card className="border-border bg-card">
          <CardContent className="space-y-2 p-5">
            <h1 className="text-lg font-bold">最近の改善</h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              このナビで直したこと・足したことを、新しい順に残しています。サーバーに負担をかけないよう、この端末で表示するだけの一覧です。
            </p>
          </CardContent>
        </Card>

        <ol className="space-y-3">
          {IMPROVEMENT_FOOTPRINTS.map((item, index) => (
            <li key={item.id}>
              <Card className="border-border bg-card">
                <CardContent className="space-y-2 p-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      {formatFootprintDate(item.date)}
                    </p>
                    {index === 0 ? (
                      <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-brand-green dark:bg-emerald-950/40">
                        最新
                      </span>
                    ) : null}
                  </div>
                  <h2 className="text-base font-semibold leading-snug">
                    {item.title}
                  </h2>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {item.summary}
                  </p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>
      </main>
    </>
  );
}
