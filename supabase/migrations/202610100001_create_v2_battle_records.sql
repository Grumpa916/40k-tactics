-- V2-only battle snapshots. This migration intentionally does not alter V1 tables.
create table if not exists public.v2_battle_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'Untitled battle' check (char_length(name) between 1 and 160),
  state_version integer not null check (state_version > 0),
  game_state jsonb not null check (jsonb_typeof(game_state) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint v2_battle_records_state_version_matches_snapshot
    check ((game_state ->> 'version') ~ '^[0-9]+$' and (game_state ->> 'version')::integer = state_version)
);

create index if not exists v2_battle_records_owner_updated_idx
  on public.v2_battle_records (user_id, updated_at desc);

alter table public.v2_battle_records enable row level security;

drop policy if exists "Owner can read V2 battles" on public.v2_battle_records;
create policy "Owner can read V2 battles"
  on public.v2_battle_records for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Owner can create V2 battles" on public.v2_battle_records;
create policy "Owner can create V2 battles"
  on public.v2_battle_records for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Owner can update V2 battles" on public.v2_battle_records;
create policy "Owner can update V2 battles"
  on public.v2_battle_records for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Owner can delete V2 battles" on public.v2_battle_records;
create policy "Owner can delete V2 battles"
  on public.v2_battle_records for delete to authenticated
  using (auth.uid() = user_id);

create or replace function public.v2_battle_records_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists v2_battle_records_updated_at on public.v2_battle_records;
create trigger v2_battle_records_updated_at
  before update on public.v2_battle_records
  for each row execute function public.v2_battle_records_set_updated_at();
