"use client";

import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "./browser";
import { isSupabaseConfigured } from "./config";
import { summarizeAuthError } from "@/lib/auth/auth-errors";

export function getAuthCallbackUrl(nextPath = "/mypage"): string {
  if (typeof window === "undefined") {
    return `/auth/callback?next=${encodeURIComponent(nextPath)}`;
  }
  const origin = window.location.origin;
  return `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
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
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      message:
        "ただいまログイン機能の準備中です。しばらくしてから、もう一度お試しください。",
    };
  }

  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return { ok: false, message: "認証クライアントを初期化できませんでした。" };
  }

  const trimmed = email.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return { ok: false, message: "メールアドレスの形式を確認してください。" };
  }

  const { error } = await supabase.auth.signInWithOtp({
    email: trimmed,
    options: {
      emailRedirectTo: getAuthCallbackUrl(nextPath),
      shouldCreateUser: true,
    },
  });

  if (error) {
    return { ok: false, message: summarizeAuthError(error.message) };
  }

  return { ok: true };
}

export async function signInWithLineOAuth(
  nextPath = "/mypage?verified=line"
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      message:
        "ただいまログイン機能の準備中です。しばらくしてから、もう一度お試しください。",
    };
  }

  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return {
      ok: false,
      message: summarizeAuthError("auth client init failed"),
    };
  }

  // Supabase には組み込み LINE が無いため、カスタムプロバイダー custom:line を使う
  const lineProvider =
    (process.env.NEXT_PUBLIC_SUPABASE_LINE_PROVIDER as string | undefined) ??
    "custom:line";

  const { error } = await supabase.auth.signInWithOAuth({
    // @ts-expect-error custom OAuth provider id (e.g. custom:line)
    provider: lineProvider,
    options: {
      redirectTo: getAuthCallbackUrl(nextPath),
      scopes: "profile openid",
      queryParams: {
        bot_prompt: "normal",
      },
    },
  });

  if (error) {
    return {
      ok: false,
      message: summarizeAuthError(error.message),
    };
  }

  return { ok: true };
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
