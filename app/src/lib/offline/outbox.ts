/**
 * オフライン時の仮保存（アウトボックス）
 * ネットにつながると正式送信・同期する。
 */

import type { ActionItem, ChatMessage, UserProfile } from "@/lib/types";

const OUTBOX_KEY = "seikatsu-saiken-navi-offline-outbox";

export type PendingFeedbackKind = "improvement" | "support";

export interface PendingFeedbackItem {
  id: string;
  kind: PendingFeedbackKind;
  message: string;
  steps: string;
  device: string;
  contact: string;
  createdAt: string;
}

export interface PendingChatItem {
  id: string;
  /** 送信時点の履歴（新しいユーザー発言を含む） */
  messages: ChatMessage[];
  profile: UserProfile;
  existingActions: ActionItem[];
  createdAt: string;
}

export interface OfflineOutbox {
  /** 端末の進捗をサーバーへ送り直しが必要 */
  sessionNeedsSync: boolean;
  /** 家族共有の記録を送り直しが必要 */
  sharedCaseNeedsSync: boolean;
  feedback: PendingFeedbackItem[];
  chat: PendingChatItem[];
}

const EMPTY: OfflineOutbox = {
  sessionNeedsSync: false,
  sharedCaseNeedsSync: false,
  feedback: [],
  chat: [],
};

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `outbox-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function loadOutbox(): OfflineOutbox {
  if (typeof localStorage === "undefined") return { ...EMPTY };
  try {
    const raw = localStorage.getItem(OUTBOX_KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw) as Partial<OfflineOutbox>;
    return {
      sessionNeedsSync: Boolean(parsed.sessionNeedsSync),
      sharedCaseNeedsSync: Boolean(parsed.sharedCaseNeedsSync),
      feedback: Array.isArray(parsed.feedback) ? parsed.feedback : [],
      chat: Array.isArray(parsed.chat) ? parsed.chat : [],
    };
  } catch {
    return { ...EMPTY };
  }
}

export function saveOutbox(next: OfflineOutbox): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(OUTBOX_KEY, JSON.stringify(next));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("offline-outbox-changed"));
  }
}

export function hasPendingOutbox(box: OfflineOutbox = loadOutbox()): boolean {
  return (
    box.sessionNeedsSync ||
    box.sharedCaseNeedsSync ||
    box.feedback.length > 0 ||
    box.chat.length > 0
  );
}

export function markSessionNeedsSync(): void {
  const box = loadOutbox();
  if (box.sessionNeedsSync) return;
  saveOutbox({ ...box, sessionNeedsSync: true });
}

export function clearSessionNeedsSync(): void {
  const box = loadOutbox();
  if (!box.sessionNeedsSync) return;
  saveOutbox({ ...box, sessionNeedsSync: false });
}

export function markSharedCaseNeedsSync(): void {
  const box = loadOutbox();
  if (box.sharedCaseNeedsSync) return;
  saveOutbox({ ...box, sharedCaseNeedsSync: true });
}

export function clearSharedCaseNeedsSync(): void {
  const box = loadOutbox();
  if (!box.sharedCaseNeedsSync) return;
  saveOutbox({ ...box, sharedCaseNeedsSync: false });
}

export function enqueueFeedback(
  item: Omit<PendingFeedbackItem, "id" | "createdAt">
): PendingFeedbackItem {
  const entry: PendingFeedbackItem = {
    ...item,
    id: createId(),
    createdAt: new Date().toISOString(),
  };
  const box = loadOutbox();
  saveOutbox({ ...box, feedback: [...box.feedback, entry] });
  return entry;
}

export function removeFeedback(id: string): void {
  const box = loadOutbox();
  saveOutbox({
    ...box,
    feedback: box.feedback.filter((f) => f.id !== id),
  });
}

export function enqueueChat(
  item: Omit<PendingChatItem, "id" | "createdAt">
): PendingChatItem {
  const entry: PendingChatItem = {
    ...item,
    id: createId(),
    createdAt: new Date().toISOString(),
  };
  const box = loadOutbox();
  saveOutbox({ ...box, chat: [...box.chat, entry] });
  return entry;
}

export function removeChat(id: string): void {
  const box = loadOutbox();
  saveOutbox({
    ...box,
    chat: box.chat.filter((c) => c.id !== id),
  });
}

export function clearOutboxOnReset(): void {
  saveOutbox({ ...EMPTY });
}
