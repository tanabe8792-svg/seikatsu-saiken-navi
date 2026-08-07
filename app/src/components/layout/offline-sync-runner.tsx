"use client";

import { useEffect, useRef } from "react";
import { useUserSession } from "@/hooks/use-user-session";
import { useToast } from "@/providers/toast-provider";
import { isBrowserOnline, subscribeOnlineStatus } from "@/lib/offline/network";
import { hasPendingOutbox } from "@/lib/offline/outbox";
import {
  flushChatQueue,
  flushFeedbackQueue,
} from "@/lib/offline/flush-outbox";

/**
 * オンライン復帰時に、オフラインで残した改善の声・AI相談を正式送信する。
 * 進捗のサーバー同期は SessionProvider 側で行う。
 */
export function OfflineSyncRunner() {
  const { applyChatResult } = useUserSession();
  const { showToast } = useToast();
  const flushing = useRef(false);
  const applyRef = useRef(applyChatResult);
  applyRef.current = applyChatResult;

  useEffect(() => {
    async function flushRemoteInputs() {
      if (!isBrowserOnline() || flushing.current) return;
      if (!hasPendingOutbox()) return;

      flushing.current = true;
      try {
        const feedbackSent = await flushFeedbackQueue();
        const chatSent = await flushChatQueue((result) =>
          applyRef.current(result)
        );
        if (feedbackSent > 0 || chatSent > 0) {
          showToast("オフラインで残した内容を、正式に送りました");
        }
      } finally {
        flushing.current = false;
      }
    }

    function onSessionSynced() {
      showToast("オフラインで残した進捗を、正式に反映しました");
    }

    void flushRemoteInputs();
    const unsub = subscribeOnlineStatus((online) => {
      if (online) void flushRemoteInputs();
    });
    window.addEventListener("offline-session-synced", onSessionSynced);
    return () => {
      unsub();
      window.removeEventListener("offline-session-synced", onSessionSynced);
    };
  }, [showToast]);

  return null;
}
