"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/providers/toast-provider";

export type FeedbackFormKind = "improvement" | "support";

interface FeedbackFormProps {
  kind?: FeedbackFormKind;
}

export function FeedbackForm({ kind = "improvement" }: FeedbackFormProps) {
  const { showToast } = useToast();
  const [message, setMessage] = useState("");
  const [steps, setSteps] = useState("");
  const [device, setDevice] = useState("");
  const [contact, setContact] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const isSupport = kind === "support";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          message,
          steps: isSupport ? "" : steps,
          device: isSupport ? "" : device,
          contact,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        ok?: boolean;
        delivered?: boolean;
      };
      if (!res.ok || !data.ok) {
        showToast(data.error ?? "送信に失敗しました");
        return;
      }
      setSent(true);
      setMessage("");
      setSteps("");
      setDevice("");
      setContact("");
      showToast("送信が完了しました");
    } catch {
      showToast("送信に失敗しました。通信環境をご確認ください。");
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div
        className="space-y-4 rounded-2xl border-2 border-emerald-400 bg-emerald-50 px-5 py-6 dark:border-emerald-700 dark:bg-emerald-950/40"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-8 w-8 shrink-0 text-emerald-700 dark:text-emerald-300" />
          <div className="space-y-2">
            <p className="text-lg font-bold text-emerald-950 dark:text-emerald-50">
              送信が完了しました
            </p>
            <p className="text-sm leading-relaxed text-emerald-900 dark:text-emerald-100">
              {isSupport
                ? "メッセージを受け取りました。内容を確認します。返信先を書いていただいた場合は、必要に応じてご連絡します。"
                : "改善の声を受け取りました。内容を確認し、サービス改善に活かします。"}
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full bg-background"
          onClick={() => setSent(false)}
        >
          もう一度送る
        </Button>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
      <div className="space-y-2">
        <label htmlFor={`feedback-message-${kind}`} className="text-sm font-medium">
          {isSupport ? "メッセージ（必須）" : "気になったこと（必須）"}
        </label>
        <Textarea
          id={`feedback-message-${kind}`}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          required
          placeholder={
            isSupport
              ? "応援・ご紹介・ご質問・ご連絡など"
              : "分かりにくかったところ、追加してほしい情報、困ったことなど"
          }
          className="min-h-[100px] text-base"
        />
      </div>

      {!isSupport && (
        <>
          <div className="space-y-2">
            <label htmlFor="feedback-steps" className="text-sm font-medium">
              再現のしかた（任意）
            </label>
            <Textarea
              id="feedback-steps"
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
              rows={3}
              placeholder="どの画面で → 何をしたら → どうなったか"
              className="text-base"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="feedback-device" className="text-sm font-medium">
              端末・ブラウザ（任意）
            </label>
            <Textarea
              id="feedback-device"
              value={device}
              onChange={(e) => setDevice(e.target.value)}
              rows={2}
              placeholder="例: iPhone / Safari"
              className="text-base"
            />
          </div>
        </>
      )}

      <div className="space-y-2">
        <label
          htmlFor={`feedback-contact-${kind}`}
          className="text-sm font-medium"
        >
          返信が必要なときの連絡先（任意）
        </label>
        <Input
          id={`feedback-contact-${kind}`}
          type="email"
          inputMode="email"
          autoComplete="email"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="メールアドレスなど（任意）"
          className="h-12 text-base"
        />
      </div>

      <Button
        type="submit"
        size="lg"
        className="h-14 w-full text-lg"
        disabled={sending || message.trim().length < 5}
      >
        {sending ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            送信中…
          </>
        ) : isSupport ? (
          "メッセージを送る"
        ) : (
          "改善の声を送る"
        )}
      </Button>
      <p className="text-xs leading-relaxed text-muted-foreground">
        5文字以上書いてから送れます。送信が成功すると、「送信が完了しました」と表示されます。
      </p>
    </form>
  );
}
