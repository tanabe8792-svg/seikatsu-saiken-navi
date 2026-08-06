-- 生活再建ナビ Supabase スキーマ（MVP）
-- Supabase SQL Editor で実行してください

create table if not exists public.user_sessions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  profile jsonb not null default '{}'::jsonb,
  actions jsonb not null default '[]'::jsonb,
  chat_history jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_sessions enable row level security;

create policy "Users can read own session"
  on public.user_sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert own session"
  on public.user_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own session"
  on public.user_sessions for update
  using (auth.uid() = user_id);

-- 匿名ログインを有効にする場合:
-- Supabase Dashboard > Authentication > Providers > Anonymous sign-ins を ON
