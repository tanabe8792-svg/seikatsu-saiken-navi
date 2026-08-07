"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FAQ_CATEGORIES, FAQ_ITEMS } from "@/lib/faq";
import { cn } from "@/lib/utils";

const FAQ_READ_STORAGE_KEY = "seikatsu-saiken-navi-faq-read-v1";

function loadReadIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(FAQ_READ_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === "string"));
  } catch {
    return new Set();
  }
}

function saveReadIds(ids: Set<string>): void {
  localStorage.setItem(FAQ_READ_STORAGE_KEY, JSON.stringify([...ids]));
}

export function FaqChecklist() {
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReadIds(loadReadIds());
    setReady(true);
  }, []);

  function toggleRead(id: string) {
    setReadIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveReadIds(next);
      return next;
    });
  }

  const readCount = ready
    ? FAQ_ITEMS.filter((item) => readIds.has(item.id)).length
    : 0;

  return (
    <div className="space-y-6">
      <p className="text-sm leading-relaxed text-muted-foreground">
        質問は多いので、読んだらタップしてチェックしてください。色が変わったものは、この端末に覚えておきます。戻っても消えません。
      </p>
      {ready ? (
        <p className="text-sm font-medium">
          確認済み {readCount}/{FAQ_ITEMS.length}
        </p>
      ) : null}

      {FAQ_CATEGORIES.map((category) => (
        <section key={category} className="space-y-3">
          <h2 className="text-lg font-semibold text-primary">{category}</h2>
          {FAQ_ITEMS.filter((item) => item.category === category).map(
            (item) => {
              const read = readIds.has(item.id);
              return (
                <Card
                  key={item.id}
                  className={cn(
                    "transition-colors",
                    read
                      ? "border-brand-green/50 bg-emerald-50/80 dark:border-brand-green/40 dark:bg-emerald-950/30"
                      : "border-border bg-card"
                  )}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold">
                      Q. {item.question}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-base leading-relaxed text-muted-foreground">
                      A. {item.answer}
                    </p>
                    <button
                      type="button"
                      onClick={() => toggleRead(item.id)}
                      className={cn(
                        "flex w-full items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-colors",
                        read
                          ? "border-brand-green/60 bg-brand-green/10 text-brand-green"
                          : "border-border bg-background text-foreground hover:bg-muted/50"
                      )}
                    >
                      {read ? (
                        <>
                          <Check className="h-4 w-4" aria-hidden />
                          確認済み（タップで戻せる）
                        </>
                      ) : (
                        "読んだらタップしてチェック"
                      )}
                    </button>
                  </CardContent>
                </Card>
              );
            }
          )}
        </section>
      ))}

      <Button asChild variant="outline" className="w-full">
        <Link href="/chat">AI相談で質問する</Link>
      </Button>
    </div>
  );
}
