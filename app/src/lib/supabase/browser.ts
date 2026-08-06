"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { UserSession } from "@/lib/types";
import { isSupabaseConfigured } from "./config";

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!browserClient) {
    browserClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return browserClient;
}

export async function saveSessionToSupabase(
  userId: string,
  session: UserSession
): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return;

  const { error } = await supabase.from("user_sessions").upsert(
    {
      user_id: userId,
      profile: session.profile,
      actions: session.actions,
      chat_history: session.chatHistory,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    throw new Error(`セッションの保存に失敗しました: ${error.message}`);
  }
}

export async function loadSessionFromSupabase(
  userId: string
): Promise<UserSession | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("user_sessions")
    .select("profile, actions, chat_history, updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return null;

  return {
    profile: (data.profile as UserSession["profile"]) ?? {},
    actions: (data.actions as UserSession["actions"]) ?? [],
    chatHistory: (data.chat_history as UserSession["chatHistory"]) ?? [],
    updatedAt: data.updated_at ?? new Date().toISOString(),
  };
}

export async function signInAnonymously(): Promise<string | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) return null;
  return data.user?.id ?? null;
}

export async function getCurrentUserId(): Promise<string | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;

  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export { isSupabaseConfigured } from "./config";
