"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/providers/toast-provider";
import { isBrowserOnline } from "@/lib/offline/network";
import { enqueueFeedback } from "@/lib/offline/outbox";

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
  const [queuedOffline, setQueuedOffline] = useState(false);

  const isSupport = kind === "support";

  function clearFields() {
    setMessage("");
    setSteps("");
    setDevice("");
    setContact("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    try {
      const payload = {
        kind,
        message,
        steps: isSupport ? "" : steps,
        device: isSupport ? "" : device,
        contact,
      };

      if (!isBrowserOnline()) {
        enqueueFeedback(payload);
        clearFields();
        setQueuedOffline(true);
        setSent(true);
        showToast("この端末に残しました。つながったら正式に送ります");
        return;
      }

      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        ok?: boolean;
        delivered?: boolean;
      };
      if (!res.ok || !data.ok) {
        enqueueFeedback(payload);
        clearFields();
        setQueuedOffline(true);
        setSent(true);
        showToast(
          data.error
            ? `${data.error} いったん端末に残しました。`
            : "送れなかったため、端末に残しました。つながったら送ります。"
        );
        return;
      }
      setQueuedOffline(false);
      setSent(true);
      clearFields();
      showToast("送信が完了しました");
    } catch {
      enqueueFeedback({
        kind,
        message,
        steps: isSupport ? "" : steps,
        device: isSupport ? "" : device,
        contact,
      });
      clearFields();
      setQueuedOffline(true);
      setSent(true);
      showToast("送れなかったため、端末に残しました。つながったら送ります。");
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
              {queuedOffline ? "この端末に残しました" : "送信が完了しました"}
            </p>
            <p className="text-sm leading-relaxed text-emerald-900 dark:text-emerald-100">
              {queuedOffline
                ? "ネットにつながったあと、正式に送ります。画面を閉じても大丈夫です。"
                : isSupport
                  ? "メッセージを受け取りました。内容を確認します。返信先を書いていただいた場合は、必要に応じてご連絡します。"
                  : "改善の声を受け取りました。内容を確認し、分かりやすさの改善に役立てます。"}
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full bg-background"
          onClick={() => {
            setSent(false);
            setQueuedOffline(false);
          }}
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
              どの画面で・何をしたら・どうなったか（任意）
            </label>
            <Textarea
              id="feedback-steps"
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
              rows={3}
              placeholder="例: やること一覧で → 「ここから進む」を押したら → 画面が開かなかった"
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
        5文字以上書いてから送れます。オフラインのときは端末に残し、つながったら正式に送ります。
      </p>
    </form>
  );
}
