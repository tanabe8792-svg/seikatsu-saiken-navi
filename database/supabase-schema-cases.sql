-- ケース中心アクセス（草案）
-- docs/26_ケース中心アクセス設計.md
-- 本番適用は P1 で判断。既存 user_sessions と並行運用する想定。

-- ケース本体（既存 CaseFile JSON を載せる）
create table if not exists public.cases (
  id uuid primary key default gen_random_uuid(),
  public_case_id text not null unique,
  municipality_code text,
  subject_name text,
  subject_birth_date date,
  subject_address text,
  case_file jsonb not null default '{}'::jsonb,
  status text not null default 'active'
    check (status in ('active', 'waiting_user', 'waiting_external', 'completed', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cases_municipality_idx on public.cases (municipality_code);
create index if not exists cases_updated_at_idx on public.cases (updated_at desc);

-- ケースへのメンバーシップ（アカウント共有ではなくケース共有）
create table if not exists public.case_members (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  role text not null
    check (role in ('owner', 'family', 'government', 'swc', 'volunteer', 'viewer')),
  display_name text,
  permissions jsonb,
  invited_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (case_id, user_id)
);

create index if not exists case_members_user_idx on public.case_members (user_id);
create index if not exists case_members_case_idx on public.case_members (case_id);

-- QR / 回復 / 窓口一時アクセス（平文トークンは保存しない）
create table if not exists public.case_access_tokens (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  kind text not null check (kind in ('qr_session', 'recovery', 'staff_temp', 'family_invite')),
  token_hash text not null unique,
  expires_at timestamptz,
  max_uses integer,
  use_count integer not null default 0,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists case_access_tokens_case_idx on public.case_access_tokens (case_id);

-- 監査（代理アクセスの説明責任）
create table if not exists public.case_audit_log (
  id bigserial primary key,
  case_id uuid not null references public.cases (id) on delete cascade,
  actor_user_id uuid references auth.users (id) on delete set null,
  actor_role text,
  action text not null,
  meta jsonb,
  created_at timestamptz not null default now()
);

create index if not exists case_audit_log_case_idx on public.case_audit_log (case_id, created_at desc);

alter table public.cases enable row level security;
alter table public.case_members enable row level security;
alter table public.case_access_tokens enable row level security;
alter table public.case_audit_log enable row level security;

-- メンバーのみケース本文を読める（草案ポリシー）
create policy cases_select_member on public.cases
  for select using (
    exists (
      select 1 from public.case_members m
      where m.case_id = cases.id and m.user_id = auth.uid()
    )
  );

create policy case_members_select_own_cases on public.case_members
  for select using (
    user_id = auth.uid()
    or exists (
      select 1 from public.case_members m
      where m.case_id = case_members.case_id and m.user_id = auth.uid()
    )
  );

-- insert/update は Edge Function（サービスロール）経由を推奨。
-- クライアント直書きポリシーは P1 実装時にロール別に追加する。
