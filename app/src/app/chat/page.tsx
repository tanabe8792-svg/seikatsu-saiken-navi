"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Loader2, Send, ListChecks } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useUserSession } from "@/hooks/use-user-session";
import type { ChatMessage, UserProfile } from "@/lib/types";
import { createMessageId } from "@/lib/session-storage";

function createMessage(role: "user" | "assistant", content: string): ChatMessage {
  return {
    id: createMessageId(),
    role,
    content,
    createdAt: new Date().toISOString(),
  };
}

function buildWelcomeMessage(profile: UserProfile): ChatMessage {
  if (profile.j00Completed && profile.municipality && profile.housingDamage) {
    return createMessage(
      "assistant",
      `${profile.municipality}・${profile.housingDamage}の状況、引き継いでいます。\n\nいま困っていることや、確認したいことがあれば教えてください。`
    );
  }

  if (profile.j00Completed) {
    return createMessage(
      "assistant",
      "はじめにでいただいた状況、引き継いでいます。\n\nいま困っていることや、確認したいことがあれば教えてください。"
    );
  }

  return createMessage(
    "assistant",
    "令和8年熊本地震について、状況を教えてください。\n\n通信が不安なときは、メニューの「状況を選び直す」から選ぶ方法もおすすめです。"
  );
}

export default function ChatPage() {
  const { session, loading, applyChatResult } = useUserSession();
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!loading && !initializedRef.current && session.chatHistory.length === 0) {
      initializedRef.current = true;
      applyChatResult({ messages: [buildWelcomeMessage(session.profile)] });
    }
  }, [loading, session.chatHistory.length, session.profile, applyChatResult]);

  useEffect(() => {
    setIsComplete(session.actions.length > 0);
  }, [session.actions.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session.chatHistory, sending]);

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    setError(null);
    setSending(true);
    setInput("");

    const userMessage = createMessage("user", trimmed);
    const nextMessages = [...session.chatHistory, userMessage];

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages,
          profile: session.profile,
          existingActions: session.actions,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "送信に失敗しました");
      }

      const assistantMessage = createMessage("assistant", data.message);

      applyChatResult({
        messages: [userMessage, assistantMessage],
        profile: data.profile,
        actions: data.actions,
      });

      setIsComplete(Boolean(data.isComplete || data.actions?.length));
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }

  if (loading) {
    return (
      <>
        <SiteHeader title="AI相談" showBack backHref="/mypage" />
        <div
          className="flex min-h-[60vh] items-center justify-center"
          role="status"
          aria-label="読み込み中"
        >
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </>
    );
  }

  return (
    <>
      <SiteHeader title="AI相談" showBack backHref="/mypage" />
      <main className="flex min-h-[calc(100vh-8rem)] flex-col px-4 pb-4">
        <div
          className="flex-1 space-y-4 py-4"
          role="log"
          aria-live="polite"
          aria-relevant="additions"
          aria-label="チャット履歴"
        >
          {session.chatHistory.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <Card
                className={`max-w-[85%] px-4 py-3 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card"
                }`}
              >
                <p className="whitespace-pre-wrap text-base leading-relaxed">
                  {message.content}
                </p>
              </Card>
            </div>
          ))}

          {sending && (
            <div className="flex justify-start" role="status" aria-label="返答を生成中">
              <Card className="px-4 py-3">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </Card>
            </div>
          )}

          {isComplete && session.actions.length > 0 && (
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
              <p className="mb-3 text-base font-medium">
                やることリストを作成しました
              </p>
              <Button asChild className="w-full">
                <Link href="/actions">
                  <ListChecks className="h-5 w-5" />
                  行動リストを見る
                </Link>
              </Button>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {error && (
          <div className="space-y-2" role="alert">
            <p className="text-sm text-destructive">{error}</p>
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href="/start">通信が不安なときは「状況を選ぶ」へ</Link>
            </Button>
          </div>
        )}

        <div className="sticky bottom-20 space-y-2 rounded-2xl border bg-background p-3">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="状況を入力してください（例：宇城市、家が半壊しました）"
            rows={3}
            disabled={sending}
            aria-label="メッセージ入力"
            maxLength={2000}
          />
          <Button
            onClick={() => void handleSend()}
            disabled={!input.trim() || sending}
            className="w-full"
            aria-busy={sending}
          >
            {sending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Send className="h-5 w-5" />
                送信
              </>
            )}
          </Button>
        </div>
      </main>
    </>
  );
}
