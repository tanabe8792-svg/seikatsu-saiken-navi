"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CloudSun,
  ExternalLink,
  Loader2,
  Thermometer,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SourceFreshnessNote } from "@/components/common/source-freshness-note";
import type { AreaWeatherSnapshot } from "@/lib/weather/area-weather";
import { cn } from "@/lib/utils";

interface AreaWeatherCardProps {
  municipalityName?: string;
}

export function AreaWeatherCard({ municipalityName }: AreaWeatherCardProps) {
  const [data, setData] = useState<AreaWeatherSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!municipalityName) {
      setData(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void fetch(
      `/api/weather?municipality=${encodeURIComponent(municipalityName)}`
    )
      .then(async (res) => {
        const json = (await res.json()) as AreaWeatherSnapshot & {
          error?: string;
        };
        if (!res.ok) {
          throw new Error(json.error ?? "取得に失敗しました");
        }
        if (!cancelled) setData(json);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setData(null);
          setError(err instanceof Error ? err.message : "取得に失敗しました");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [municipalityName]);

  if (!municipalityName) return null;

  return (
    <Card
      className={cn(
        "border-border bg-card",
        data?.severity === "emergency" && "border-red-300 bg-red-50",
        data?.severity === "warning" && "border-amber-300 bg-amber-50",
        data?.severity === "advisory" && "border-sky-200 bg-sky-50/60"
      )}
    >
      <CardContent className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {municipalityName}のいまの気象
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              台風・警報など、この地域向けの情報です
            </p>
          </div>
          <CloudSun className="h-5 w-5 shrink-0 text-brand-green" aria-hidden />
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            気象情報を取得しています…
          </div>
        )}

        {error && !loading && (
          <p className="text-sm text-muted-foreground">{error}</p>
        )}

        {data && !loading && (
          <>
            <div className="flex flex-wrap items-end gap-4">
              {data.temperatureC !== null && (
                <p className="flex items-baseline gap-1 text-3xl font-bold tabular-nums">
                  <Thermometer className="mb-1 h-5 w-5 text-brand-orange" />
                  {data.temperatureC}
                  <span className="text-base font-medium text-muted-foreground">
                    ℃
                  </span>
                </p>
              )}
              {data.weatherLabel && (
                <p className="text-base font-medium">{data.weatherLabel}</p>
              )}
              {data.humidity !== null && (
                <p className="text-sm text-muted-foreground">
                  湿度 {data.humidity}%
                </p>
              )}
            </div>

            {data.typhoonNote && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 text-sm leading-relaxed text-amber-950">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{data.typhoonNote}</p>
              </div>
            )}

            {data.warnings.length > 0 ? (
              <ul className="space-y-1.5">
                {data.warnings.map((w) => (
                  <li
                    key={w}
                    className="flex items-start gap-2 text-sm font-medium leading-relaxed"
                  >
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                    {w}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                いま発表中の警報・注意報はありません（取得時点）。
              </p>
            )}

            <a
              href={data.officialWarningUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-2 hover:underline"
            >
              気象庁で最新を確認する
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <SourceFreshnessNote
              fetchedAt={data.fetchedAt}
              label="この天気・警報の取得時点"
              showStaleHint={false}
            />
            <p className="text-[11px] text-muted-foreground">
              出典: {data.sourceLabel}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
