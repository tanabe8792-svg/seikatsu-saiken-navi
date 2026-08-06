"use client";

import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "./browser";
import { isSupabaseConfigured } from "./config";

export function getAuthCallbackUrl(nextPath = "/settings"): string {
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
  email: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      message:
        "メール認証の準備ができていません。Supabase の設定を管理者にお問い合わせください。",
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
      emailRedirectTo: getAuthCallbackUrl("/settings?verified=email"),
      shouldCreateUser: true,
    },
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true };
}

export async function signInWithLineOAuth(): Promise<
  { ok: true } | { ok: false; message: string }
> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      message:
        "LINEログインの準備ができていません。Supabase と LINE Login の設定を管理者にお問い合わせください。",
    };
  }

  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return { ok: false, message: "認証クライアントを初期化できませんでした。" };
  }

  // Supabase Dashboard で LINE provider を有効化すると利用可能
  const { error } = await supabase.auth.signInWithOAuth({
    // @ts-expect-error LINE provider is configured in Supabase Dashboard
    provider: "line",
    options: {
      redirectTo: getAuthCallbackUrl("/settings?verified=line"),
    },
  });

  if (error) {
    return {
      ok: false,
      message:
        "LINEログインを開始できませんでした。LINE Login チャネルが Supabase に設定されているか確認してください。",
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
