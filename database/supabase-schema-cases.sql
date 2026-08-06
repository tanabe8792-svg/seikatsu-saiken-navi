-- ケース中心アクセス P1（家族招待）+ 将来拡張カラム
-- docs/26 / docs/27
-- Supabase SQL Editor で実行（既存草案があっても ALTER で足せるよう IF NOT EXISTS / 追加列）

-- ========== cases ==========
create table if not exists public.cases (
  id uuid primary key default gen_random_uuid(),
  public_case_id text not null unique,
  internal_case_id text unique,
  municipality_code text,
  subject_name text,
  subject_birth_date date,
  subject_address text,
  case_file jsonb not null default '{}'::jsonb,
  -- レガシー互換（CaseFile.status に近い）
  status text not null default 'active'
    check (status in ('active', 'waiting_user', 'waiting_external', 'completed', 'closed')),
  -- 運用上のケース状態（P3 行政向け・現状はアプリから任意更新）
  case_status text not null default 'self_managing'
    check (case_status in (
      'self_managing',   -- 本人対応中
      'family_support',  -- 家族支援中
      'gov_support',     -- 行政支援中
      'completed'        -- 生活再建完了
    )),
  assigned_organization text,
  assigned_user uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 既存テーブルへの列追加（草案適用済み環境向け）
alter table public.cases add column if not exists internal_case_id text;
alter table public.cases add column if not exists case_status text;
alter table public.cases add column if not exists assigned_organization text;
alter table public.cases add column if not exists assigned_user uuid;
alter table public.cases add column if not exists updated_by uuid;

create unique index if not exists cases_internal_case_id_uidx
  on public.cases (internal_case_id) where internal_case_id is not null;
create index if not exists cases_municipality_idx on public.cases (municipality_code);
create index if not exists cases_updated_at_idx on public.cases (updated_at desc);
create index if not exists cases_case_status_idx on public.cases (case_status);

-- ========== case_members ==========
create table if not exists public.case_members (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  user_id uuid references auth.users (id) on delete cascade,
  role text not null
    check (role in ('owner', 'family', 'government', 'swc', 'volunteer', 'viewer')),
  -- P1: 閲覧のみ / 編集可（ロールとは別にケース単位）
  access_level text not null default 'view'
    check (access_level in ('view', 'edit')),
  display_name text,
  permissions jsonb,
  invited_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (case_id, user_id)
);

alter table public.case_members add column if not exists access_level text;
-- 既存行の default
update public.case_members set access_level = 'edit' where access_level is null and role = 'owner';
update public.case_members set access_level = 'view' where access_level is null;

create index if not exists case_members_user_idx on public.case_members (user_id);
create index if not exists case_members_case_idx on public.case_members (case_id);

-- ========== case_invites（家族招待） ==========
create table if not exists public.case_invites (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  invite_code text not null unique,
  access_level text not null default 'view'
    check (access_level in ('view', 'edit')),
  role text not null default 'family'
    check (role in ('family', 'viewer', 'volunteer')),
  expires_at timestamptz,
  max_uses integer not null default 5,
  use_count integer not null default 0,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create index if not exists case_invites_case_idx on public.case_invites (case_id);
create index if not exists case_invites_code_idx on public.case_invites (invite_code);

-- ========== 既存 access_tokens / audit（互換） ==========
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

create table if not exists public.case_audit_log (
  id bigserial primary key,
  case_id uuid not null references public.cases (id) on delete cascade,
  actor_user_id uuid references auth.users (id) on delete set null,
  actor_role text,
  action text not null,
  meta jsonb,
  created_at timestamptz not null default now()
);

create index if not exists case_audit_log_case_idx
  on public.case_audit_log (case_id, created_at desc);

-- ========== RLS ==========
alter table public.cases enable row level security;
alter table public.case_members enable row level security;
alter table public.case_invites enable row level security;
alter table public.case_access_tokens enable row level security;
alter table public.case_audit_log enable row level security;

-- ポリシーは作り直し
drop policy if exists cases_select_member on public.cases;
drop policy if exists cases_update_editor on public.cases;
drop policy if exists case_members_select_own_cases on public.case_members;
drop policy if exists case_members_select_peers on public.case_members;
drop policy if exists case_invites_select_creator on public.case_invites;
drop policy if exists case_audit_select_member on public.case_audit_log;

create policy cases_select_member on public.cases
  for select to authenticated
  using (
    exists (
      select 1 from public.case_members m
      where m.case_id = cases.id and m.user_id = auth.uid()
    )
  );

create policy cases_update_editor on public.cases
  for update to authenticated
  using (
    exists (
      select 1 from public.case_members m
      where m.case_id = cases.id
        and m.user_id = auth.uid()
        and m.access_level = 'edit'
    )
  )
  with check (
    exists (
      select 1 from public.case_members m
      where m.case_id = cases.id
        and m.user_id = auth.uid()
        and m.access_level = 'edit'
    )
  );

create policy case_members_select_peers on public.case_members
  for select to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.case_members m
      where m.case_id = case_members.case_id and m.user_id = auth.uid()
    )
  );

create policy case_invites_select_creator on public.case_invites
  for select to authenticated
  using (
    created_by = auth.uid()
    or exists (
      select 1 from public.case_members m
      where m.case_id = case_invites.case_id
        and m.user_id = auth.uid()
        and m.role = 'owner'
    )
  );

create policy case_audit_select_member on public.case_audit_log
  for select to authenticated
  using (
    exists (
      select 1 from public.case_members m
      where m.case_id = case_audit_log.case_id and m.user_id = auth.uid()
    )
  );

-- ========== ヘルパー ==========
create or replace function public.is_case_owner(p_case_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.case_members
    where case_id = p_case_id and user_id = auth.uid() and role = 'owner'
  );
$$;

create or replace function public.write_case_audit(
  p_case_id uuid,
  p_action text,
  p_meta jsonb default null,
  p_actor_role text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.case_audit_log (case_id, actor_user_id, actor_role, action, meta)
  values (p_case_id, auth.uid(), p_actor_role, p_action, p_meta);
end;
$$;

-- ========== RPC: 所有者としてケースを公開（招待の前提） ==========
create or replace function public.publish_owned_case(
  p_public_case_id text,
  p_internal_case_id text,
  p_case_file jsonb,
  p_municipality_code text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_case_id uuid;
  v_public text := upper(trim(p_public_case_id));
begin
  if v_uid is null then
    raise exception 'LOGIN_REQUIRED';
  end if;
  if v_public is null or length(v_public) < 6 then
    raise exception 'INVALID_PUBLIC_CASE_ID';
  end if;

  select id into v_case_id
  from public.cases
  where public_case_id = v_public
     or (p_internal_case_id is not null and internal_case_id = p_internal_case_id)
  limit 1;

  if v_case_id is null then
    insert into public.cases (
      public_case_id,
      internal_case_id,
      municipality_code,
      case_file,
      updated_by
    ) values (
      v_public,
      nullif(p_internal_case_id, ''),
      p_municipality_code,
      coalesce(p_case_file, '{}'::jsonb),
      v_uid
    )
    returning id into v_case_id;

    insert into public.case_members (case_id, user_id, role, access_level)
    values (v_case_id, v_uid, 'owner', 'edit');

    perform public.write_case_audit(v_case_id, 'case_published', jsonb_build_object('public_case_id', v_public), 'owner');
  else
    if not public.is_case_owner(v_case_id) then
      -- 既に他人のケースなら拒否。自分が owner なら更新。
      if exists (select 1 from public.case_members where case_id = v_case_id and user_id = v_uid and role = 'owner') then
        null;
      elsif exists (select 1 from public.case_members where case_id = v_case_id) then
        raise exception 'CASE_OWNED_BY_OTHER';
      else
        insert into public.case_members (case_id, user_id, role, access_level)
        values (v_case_id, v_uid, 'owner', 'edit')
        on conflict (case_id, user_id) do update
          set role = 'owner', access_level = 'edit';
      end if;
    end if;

    update public.cases set
      case_file = coalesce(p_case_file, case_file),
      municipality_code = coalesce(p_municipality_code, municipality_code),
      internal_case_id = coalesce(nullif(p_internal_case_id, ''), internal_case_id),
      public_case_id = v_public,
      updated_by = v_uid,
      updated_at = now()
    where id = v_case_id;
  end if;

  return v_case_id;
end;
$$;

-- ========== RPC: 家族招待の作成 ==========
create or replace function public.create_family_invite(
  p_case_id uuid,
  p_access_level text default 'view',
  p_days_valid integer default 14
)
returns table (invite_code text, expires_at timestamptz, case_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_code text;
  v_expires timestamptz;
  v_level text := case when p_access_level = 'edit' then 'edit' else 'view' end;
begin
  if v_uid is null then
    raise exception 'LOGIN_REQUIRED';
  end if;
  if not public.is_case_owner(p_case_id) then
    raise exception 'OWNER_ONLY';
  end if;

  -- 読みやすい招待コード
  v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 4)
    || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 4));
  v_expires := now() + make_interval(days => greatest(1, least(coalesce(p_days_valid, 14), 90)));

  insert into public.case_invites (
    case_id, invite_code, access_level, role, expires_at, max_uses, created_by
  ) values (
    p_case_id, v_code, v_level, 'family', v_expires, 5, v_uid
  );

  perform public.write_case_audit(
    p_case_id,
    'invite_created',
    jsonb_build_object('access_level', v_level, 'expires_at', v_expires),
    'owner'
  );

  -- 家族招待が出たら状態を family_support に寄せる（行政は未使用）
  update public.cases
  set case_status = case
      when case_status = 'completed' then case_status
      else 'family_support'
    end,
    updated_by = v_uid,
    updated_at = now()
  where id = p_case_id;

  return query select v_code, v_expires, p_case_id;
end;
$$;

-- ========== RPC: 招待の受諾 ==========
create or replace function public.accept_family_invite(p_invite_code text)
returns table (
  case_id uuid,
  public_case_id text,
  access_level text,
  role text,
  case_file jsonb
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_inv public.case_invites%rowtype;
  v_case public.cases%rowtype;
  v_role text;
  v_level text;
begin
  if v_uid is null then
    raise exception 'LOGIN_REQUIRED';
  end if;

  select * into v_inv
  from public.case_invites
  where invite_code = upper(trim(p_invite_code))
  for update;

  if not found then
    raise exception 'INVITE_NOT_FOUND';
  end if;
  if v_inv.revoked_at is not null then
    raise exception 'INVITE_REVOKED';
  end if;
  if v_inv.expires_at is not null and v_inv.expires_at < now() then
    raise exception 'INVITE_EXPIRED';
  end if;
  if v_inv.use_count >= v_inv.max_uses then
    raise exception 'INVITE_EXHAUSTED';
  end if;

  select * into v_case from public.cases where id = v_inv.case_id;
  if not found then
    raise exception 'CASE_NOT_FOUND';
  end if;

  -- 所有者は自分の招待を受ける必要なし
  if exists (
    select 1 from public.case_members
    where case_id = v_inv.case_id and user_id = v_uid and role = 'owner'
  ) then
    raise exception 'ALREADY_OWNER';
  end if;

  v_role := v_inv.role;
  v_level := v_inv.access_level;

  insert into public.case_members (case_id, user_id, role, access_level, invited_by)
  values (v_inv.case_id, v_uid, v_role, v_level, v_inv.created_by)
  on conflict (case_id, user_id) do update
    set access_level = case
          when excluded.access_level = 'edit' or case_members.access_level = 'edit' then 'edit'
          else 'view'
        end,
        role = excluded.role;

  update public.case_invites
  set use_count = use_count + 1
  where id = v_inv.id;

  perform public.write_case_audit(
    v_inv.case_id,
    'invite_accepted',
    jsonb_build_object('access_level', v_level, 'role', v_role),
    v_role
  );

  return query
    select v_case.id, v_case.public_case_id, v_level, v_role, v_case.case_file;
end;
$$;

-- ========== RPC: 共有ケースの更新（編集権限） ==========
create or replace function public.update_shared_case_file(
  p_case_id uuid,
  p_case_file jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'LOGIN_REQUIRED';
  end if;
  if not exists (
    select 1 from public.case_members
    where case_id = p_case_id and user_id = v_uid and access_level = 'edit'
  ) then
    raise exception 'EDIT_FORBIDDEN';
  end if;

  update public.cases set
    case_file = p_case_file,
    updated_by = v_uid,
    updated_at = now()
  where id = p_case_id;

  perform public.write_case_audit(p_case_id, 'case_file_updated', null, null);
end;
$$;

-- ========== RPC: 自分が参加しているケース一覧 ==========
create or replace function public.list_my_case_memberships()
returns table (
  case_id uuid,
  public_case_id text,
  role text,
  access_level text,
  case_status text,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.id,
    c.public_case_id,
    m.role,
    m.access_level,
    c.case_status,
    c.updated_at
  from public.case_members m
  join public.cases c on c.id = m.case_id
  where m.user_id = auth.uid()
  order by c.updated_at desc;
$$;

-- ========== RPC: メンバーとしてケース取得（P2: QR後の権限確認用） ==========
create or replace function public.get_case_by_public_id(p_public_case_id text)
returns table (
  case_id uuid,
  public_case_id text,
  role text,
  access_level text,
  case_status text,
  case_file jsonb,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.id,
    c.public_case_id,
    m.role,
    m.access_level,
    c.case_status,
    c.case_file,
    c.updated_at
  from public.cases c
  join public.case_members m on m.case_id = c.id and m.user_id = auth.uid()
  where c.public_case_id = upper(trim(p_public_case_id))
  limit 1;
$$;

grant execute on function public.publish_owned_case(text, text, jsonb, text) to authenticated;
grant execute on function public.create_family_invite(uuid, text, integer) to authenticated;
grant execute on function public.accept_family_invite(text) to authenticated;
grant execute on function public.update_shared_case_file(uuid, jsonb) to authenticated;
grant execute on function public.list_my_case_memberships() to authenticated;
grant execute on function public.get_case_by_public_id(text) to authenticated;
