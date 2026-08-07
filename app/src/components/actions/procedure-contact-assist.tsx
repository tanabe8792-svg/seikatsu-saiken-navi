"use client";

import { useMemo, useState } from "react";
import { Check, Copy, ExternalLink, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { UserProfile } from "@/lib/types";
import {
  fillEmailDraft,
  initialEmailDraftValues,
  type ContactAssistPlan,
} from "@/lib/case-management/contact-assist";
import { useToast } from "@/providers/toast-provider";

interface ProcedureContactAssistProps {
  plan: ContactAssistPlan;
  profile: UserProfile;
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

export function ProcedureContactAssist({
  plan,
  profile,
}: ProcedureContactAssistProps) {
  const { showToast } = useToast();
  const draft = plan.emailDraft;
  const [values, setValues] = useState(() =>
    draft ? initialEmailDraftValues(draft, profile) : {}
  );
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const filled = useMemo(() => {
    if (!draft) return null;
    return fillEmailDraft(draft, values);
  }, [draft, values]);

  async function handleCopy(key: string, text: string, okMessage: string) {
    const ok = await copyText(text);
    if (ok) {
      setCopiedKey(key);
      showToast(okMessage);
      window.setTimeout(() => setCopiedKey(null), 2000);
    } else {
      showToast("コピーできませんでした。長押しで選択してください");
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-semibold">{plan.heading}</h4>
        {plan.intro ? (
          <p className="mt-1 text-xs text-muted-foreground">{plan.intro}</p>
        ) : null}
      </div>

      <ol className="space-y-3">
        {plan.steps.map((step) => (
          <li
            key={`${step.priority}-${step.title}`}
            className="rounded-xl border bg-background/80 px-4 py-3"
          >
            <p className="text-sm font-semibold leading-snug">{step.title}</p>
            {step.whyFirst ? (
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {step.whyFirst}
              </p>
            ) : null}

            <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
              {step.phone && (
                <span className="inline-flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" />
                  {step.phone}
                </span>
              )}
              {step.email && (
                <span className="inline-flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" />
                  {step.email}
                </span>
              )}
              {step.hours && <span>{step.hours}</span>}
            </div>

            <details className="mt-3 border-t pt-3">
              <summary className="cursor-pointer text-xs font-medium text-foreground">
                連絡の前に見るメモ
              </summary>
              <div className="mt-2 space-y-3">
                <ul className="space-y-1 text-xs text-muted-foreground">
                  {step.prepare.map((item) => (
                    <li key={item}>・{item}</li>
                  ))}
                </ul>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium text-foreground">
                      話す内容
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 shrink-0 text-xs"
                      onClick={() =>
                        handleCopy(
                          `say-${step.priority}`,
                          step.sayScript.map((s, i) => `${i + 1}. ${s}`).join("\n"),
                          "話す内容をコピーしました"
                        )
                      }
                    >
                      {copiedKey === `say-${step.priority}` ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      コピー
                    </Button>
                  </div>
                  <ol className="space-y-1 text-xs leading-relaxed text-muted-foreground">
                    {step.sayScript.map((line) => (
                      <li key={line}>・{line}</li>
                    ))}
                  </ol>
                </div>
              </div>
            </details>

            <div className="mt-3 flex flex-col gap-2">
              {step.phone && step.phone.includes("／") === false && (
                <Button asChild size="sm" className="h-10 w-full">
                  <a href={`tel:${step.phone.replace(/[^\d+]/g, "")}`}>
                    <Phone className="h-4 w-4" />
                    電話する
                  </a>
                </Button>
              )}
              {step.officialHref && (
                <Button asChild size="sm" variant="outline" className="h-10 w-full">
                  <a
                    href={step.officialHref}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {step.officialLabel ?? "案内を開く"}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </Button>
              )}
            </div>
          </li>
        ))}
      </ol>

      {draft && filled && (
        <details className="rounded-xl border border-dashed bg-background/80 px-4 py-3">
          <summary className="cursor-pointer text-sm font-semibold">
            メール文面が必要なとき
          </summary>
          <div className="mt-3 space-y-3">
            <p className="text-xs text-muted-foreground">
              {draft.toAddress
                ? `宛先の目安: ${draft.toLabel}（${draft.toAddress}）`
                : `宛先は相談先の案内で確認してください（${draft.toLabel}）`}
            </p>

            <div className="space-y-2">
              {draft.fields.map((field) => (
                <div key={field.key} className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    {field.label}
                  </label>
                  {field.key === "damage" ||
                  field.key === "need" ||
                  field.key === "done" ? (
                    <Textarea
                      value={values[field.key] ?? ""}
                      placeholder={field.placeholder}
                      className="min-h-[72px] text-sm"
                      onChange={(e) =>
                        setValues((prev) => ({
                          ...prev,
                          [field.key]: e.target.value,
                        }))
                      }
                    />
                  ) : (
                    <Input
                      value={values[field.key] ?? ""}
                      placeholder={field.placeholder}
                      onChange={(e) =>
                        setValues((prev) => ({
                          ...prev,
                          [field.key]: e.target.value,
                        }))
                      }
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-2 rounded-lg bg-muted/40 px-3 py-3">
              <p className="text-xs font-medium">件名</p>
              <p className="text-sm leading-relaxed">{filled.subject}</p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-9 w-full"
                onClick={() =>
                  handleCopy("subject", filled.subject, "件名をコピーしました")
                }
              >
                {copiedKey === "subject" ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                件名をコピー
              </Button>
            </div>

            <div className="space-y-2 rounded-lg bg-muted/40 px-3 py-3">
              <p className="text-xs font-medium">本文</p>
              <pre className="whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
                {filled.body}
              </pre>
              <Button
                type="button"
                size="sm"
                className="h-10 w-full"
                onClick={() =>
                  handleCopy("body", filled.body, "本文をコピーしました")
                }
              >
                {copiedKey === "body" ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                本文をコピー
              </Button>
              {filled.mailtoHref && (
                <Button asChild size="sm" variant="outline" className="h-9 w-full">
                  <a href={filled.mailtoHref}>
                    <Mail className="h-3.5 w-3.5" />
                    メールアプリで開く
                  </a>
                </Button>
              )}
            </div>
          </div>
        </details>
      )}
    </div>
  );
}
