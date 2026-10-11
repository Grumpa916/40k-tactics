create table if not exists public.v2_army_rosters (
 id uuid primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 name text not null check (length(trim(name)) between 1 and 120),
 schema_version integer not null check (schema_version > 0),
 roster jsonb not null check (jsonb_typeof(roster) = 'object' and roster->>'id' = id::text and roster->>'name' = name),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists v2_army_rosters_user_updated_idx on public.v2_army_rosters(user_id, updated_at desc);
alter table public.v2_army_rosters enable row level security;
drop policy if exists "Owners can read their army rosters" on public.v2_army_rosters;
create policy "Owners can read their army rosters" on public.v2_army_rosters for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Owners can create their army rosters" on public.v2_army_rosters;
create policy "Owners can create their army rosters" on public.v2_army_rosters for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Owners can update their army rosters" on public.v2_army_rosters;
create policy "Owners can update their army rosters" on public.v2_army_rosters for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Owners can delete their army rosters" on public.v2_army_rosters;
create policy "Owners can delete their army rosters" on public.v2_army_rosters for delete to authenticated using (auth.uid() = user_id);
create or replace function public.set_v2_army_rosters_updated_at() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
drop trigger if exists v2_army_rosters_set_updated_at on public.v2_army_rosters;
create trigger v2_army_rosters_set_updated_at before update on public.v2_army_rosters for each row execute function public.set_v2_army_rosters_updated_at();
