-- 本人確認ユーザーの進捗引き継ぎ用（user_sessions 拡張）
-- Supabase SQL Editor で supabase-schema.sql の後に実行

alter table public.user_sessions
  add column if not exists case_file jsonb,
  add column if not exists j00_step integer,
  add column if not exists onboarding_timing_hint text;
