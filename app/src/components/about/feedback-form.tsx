"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/providers/toast-provider";

export function FeedbackForm() {
  const { showToast } = useToast();
  const [message, setMessage] = useState("");
  const [steps, setSteps] = useState("");
  const [device, setDevice] = useState("");
  const [contact, setContact] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, steps, device, contact }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!res.ok) {
        showToast(data.error ?? "送信に失敗しました");
        return;
      }
      setSent(true);
      setMessage("");
      setSteps("");
      setDevice("");
      setContact("");
      showToast("送信しました。ありがとうございます");
    } catch {
      showToast("送信に失敗しました");
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/50 px-4 py-4 text-sm leading-relaxed dark:border-emerald-900/40 dark:bg-emerald-950/20">
        送信しました。内容を確認し、サービス改善に活かします。また気になることがあれば、いつでも送ってください。
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
      <div className="space-y-2">
        <label htmlFor="feedback-message" className="text-sm font-medium">
          気になったこと（必須）
        </label>
        <Textarea
          id="feedback-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          required
          placeholder="分かりにくかったところ、追加してほしい情報、困ったことなど"
          className="min-h-[100px] text-base"
        />
      </div>
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
      <div className="space-y-2">
        <label htmlFor="feedback-contact" className="text-sm font-medium">
          返信が必要なときの連絡先（任意）
        </label>
        <Textarea
          id="feedback-contact"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          rows={1}
          placeholder="メールアドレスなど（任意）"
          className="text-base"
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
        ) : (
          "改善の声を送る"
        )}
      </Button>
    </form>
  );
}
