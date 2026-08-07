"use client";

import type { Provider, User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "./browser";
import { isSupabaseConfigured } from "./config";
import {
  explainAuthError,
  type UserFacingAuthError,
} from "@/lib/auth/auth-errors";

export type AuthEmailResult =
  | { ok: true }
  | { ok: false; error: UserFacingAuthError };

export function getAuthCallbackUrl(nextPath = "/mypage"): string {
  if (typeof window === "undefined") {
    return `/auth/callback?next=${encodeURIComponent(nextPath)}`;
  }
  const origin = window.location.origin;
  return `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
}

/** LINE OAuth の provider id。環境変数があれば優先。なければ line → custom:line の順で試す。 */
export function getLineProviderCandidates(): Provider[] {
  const fromEnv = process.env.NEXT_PUBLIC_SUPABASE_LINE_PROVIDER?.trim();
  const candidates: string[] = [];
  if (fromEnv) candidates.push(fromEnv);
  candidates.push("line", "custom:line");
  return [...new Set(candidates)] as Provider[];
}

function isProviderConfigError(message: string, code?: string): boolean {
  const m = message.toLowerCase();
  const c = (code ?? "").toLowerCase();
  return (
    /unsupported.?provider|provider.*(disabled|not.?enabled|not.?found)|invalid.?provider|validation_failed/i.test(
      m
    ) ||
    c.includes("validation") ||
    c.includes("provider")
  );
}

export async function getAuthUser(): Promise<User | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

export async function sendEmailVerificationLink(
  email: string,
  nextPath = "/mypage?verified=email"
): Promise<AuthEmailResult> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      error: explainAuthError(
        "ただいまログイン機能の準備中です。しばらくしてから、もう一度お試しください。"
      ),
    };
  }

  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return {
      ok: false,
      error: explainAuthError("auth client init failed"),
    };
  }

  const trimmed = email.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return {
      ok: false,
      error: explainAuthError("メールアドレスの形式を確認してください。"),
    };
  }

  // 新規も既存も同じ OTP／マジックリンク送信。
  const { error } = await supabase.auth.signInWithOtp({
    email: trimmed,
    options: {
      emailRedirectTo: getAuthCallbackUrl(nextPath),
      shouldCreateUser: true,
    },
  });

  if (error) {
    return {
      ok: false,
      error: explainAuthError(error.message, {
        status: error.status,
        code: error.code,
      }),
    };
  }

  return { ok: true };
}

export async function signInWithLineOAuth(
  nextPath = "/mypage?verified=line"
): Promise<AuthEmailResult> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      error: explainAuthError(
        "ただいまログイン機能の準備中です。しばらくしてから、もう一度お試しください。"
      ),
    };
  }

  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return {
      ok: false,
      error: explainAuthError("auth client init failed"),
    };
  }

  const redirectTo = getAuthCallbackUrl(nextPath);
  const candidates = getLineProviderCandidates();
  let lastError: { message: string; status?: number; code?: string } | null =
    null;

  for (const provider of candidates) {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
        // LINE Login: ログイン用のみ（友だち追加の bot_prompt は付けない）
        scopes: "openid profile",
        skipBrowserRedirect: true,
      },
    });

    if (error) {
      lastError = {
        message: error.message,
        status: error.status,
        code: error.code,
      };
      if (isProviderConfigError(error.message, error.code)) {
        continue;
      }
      return {
        ok: false,
        error: explainAuthError(error.message, {
          status: error.status,
          code: error.code,
        }),
      };
    }

    if (data?.url) {
      window.location.assign(data.url);
      return { ok: true };
    }
  }

  if (lastError) {
    return {
      ok: false,
      error: explainAuthError(lastError.message, {
        status: lastError.status,
        code: lastError.code,
      }),
    };
  }

  return {
    ok: false,
    error: explainAuthError(
      "LINEでの登録を開始できませんでした。運営側のLINE設定を確認してください。"
    ),
  };
}

export async function signOutVerifiedUser(): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return;
  await supabase.auth.signOut();
}

export function subscribeToAuthChanges(
  callback: (user: User | null) => void
): () => void {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return () => undefined;

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });

  return () => subscription.unsubscribe();
}
