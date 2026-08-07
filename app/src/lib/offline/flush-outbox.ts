/**
 * アウトボックスの正式送信（オンライン時）
 */

import type { ActionItem, ChatMessage, UserProfile } from "@/lib/types";
import { createMessageId } from "@/lib/session-storage";
import { isBrowserOnline } from "./network";
import {
  clearSessionNeedsSync,
  clearSharedCaseNeedsSync,
  hasPendingOutbox,
  loadOutbox,
  removeChat,
  removeFeedback,
  type PendingChatItem,
  type PendingFeedbackItem,
} from "./outbox";

export interface FlushResult {
  feedbackSent: number;
  chatSent: number;
  sessionSynced: boolean;
  sharedSynced: boolean;
}

async function sendFeedbackItem(item: PendingFeedbackItem): Promise<boolean> {
  const res = await fetch("/api/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      kind: item.kind,
      message: item.message,
      steps: item.steps,
      device: item.device,
      contact: item.contact,
    }),
  });
  const data = (await res.json().catch(() => ({}))) as { ok?: boolean };
  return res.ok && Boolean(data.ok);
}

export async function flushFeedbackQueue(): Promise<number> {
  if (!isBrowserOnline()) return 0;
  let sent = 0;
  const items = [...loadOutbox().feedback];
  for (const item of items) {
    try {
      const ok = await sendFeedbackItem(item);
      if (ok) {
        removeFeedback(item.id);
        sent += 1;
      }
    } catch {
      break;
    }
  }
  return sent;
}

function createAssistantMessage(content: string): ChatMessage {
  return {
    id: createMessageId(),
    role: "assistant",
    content,
    createdAt: new Date().toISOString(),
  };
}

export async function flushChatQueue(
  applyChatResult: (result: {
    profile?: UserProfile;
    actions?: ActionItem[];
    messages: ChatMessage[];
  }) => void
): Promise<number> {
  if (!isBrowserOnline()) return 0;
  let sent = 0;
  const items = [...loadOutbox().chat];

  for (const item of items) {
    try {
      const ok = await sendChatItem(item, applyChatResult);
      if (ok) {
        removeChat(item.id);
        sent += 1;
      } else {
        break;
      }
    } catch {
      break;
    }
  }
  return sent;
}

async function sendChatItem(
  item: PendingChatItem,
  applyChatResult: (result: {
    profile?: UserProfile;
    actions?: ActionItem[];
    messages: ChatMessage[];
  }) => void
): Promise<boolean> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: item.messages,
      profile: item.profile,
      existingActions: item.existingActions,
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) return false;

  applyChatResult({
    messages: [createAssistantMessage(String(data.message ?? ""))],
    profile: data.profile,
    actions: data.actions,
  });
  return true;
}

/** セッション／共有の同期は SessionProvider 側で行う。成功時にフラグを落とす。 */
export function noteSessionSynced(): void {
  clearSessionNeedsSync();
}

export function noteSharedCaseSynced(): void {
  clearSharedCaseNeedsSync();
}

export function summarizePendingForBanner(): string | null {
  const box = loadOutbox();
  if (!hasPendingOutbox(box)) return null;
  const parts: string[] = [];
  if (box.sessionNeedsSync || box.sharedCaseNeedsSync) {
    parts.push("進捗");
  }
  if (box.feedback.length > 0) {
    parts.push(`改善の声 ${box.feedback.length}件`);
  }
  if (box.chat.length > 0) {
    parts.push(`AI相談 ${box.chat.length}件`);
  }
  return parts.join("・");
}
