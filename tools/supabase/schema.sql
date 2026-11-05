-- Erandel accounts schema (design/gdd/accounts.md).
-- Run once in the Supabase project (SQL editor or Management API). Safe to run again.

-- One profile per account. The name is unique across all players, ignoring letter case.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 2 and 20),
  created_at timestamptz not null default now()
);
create unique index if not exists profiles_name_lower on public.profiles (lower(name));

-- One cloud save per account.
create table if not exists public.saves (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null,
  codex jsonb,
  updated_at timestamptz not null default now(),
  constraint save_size check (pg_column_size(data) < 300000)
);

alter table public.profiles enable row level security;
alter table public.saves enable row level security;

-- Names are public (they are shown in the world); only the owner may create or change theirs.
drop policy if exists "profiles are readable" on public.profiles;
create policy "profiles are readable" on public.profiles for select to anon, authenticated using (true);
drop policy if exists "own profile insert" on public.profiles;
create policy "own profile insert" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
drop policy if exists "own profile update" on public.profiles;
create policy "own profile update" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- A save is visible and writable only by its owner. Guests (anonymous sign-ins) are owners too.
drop policy if exists "own save" on public.saves;
create policy "own save" on public.saves for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

grant select on public.profiles to anon, authenticated;
grant insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.saves to authenticated;
