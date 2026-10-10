-- Read-only post-migration verification for the V2 battle persistence schema.
-- Run in the intended V2 Supabase project's SQL editor after applying
-- 202610100001_create_v2_battle_records.sql. This script does not create,
-- update, or delete application data.

do $$
declare
  table_oid regclass := to_regclass('public.v2_battle_records');
  rls_enabled boolean;
  owner_policy_count integer;
  trigger_count integer;
begin
  if table_oid is null then
    raise exception 'Missing public.v2_battle_records. Apply the V2 migration to this project first.';
  end if;

  select c.relrowsecurity
    into rls_enabled
    from pg_class c
   where c.oid = table_oid;

  if not coalesce(rls_enabled, false) then
    raise exception 'RLS is not enabled on public.v2_battle_records.';
  end if;

  select count(*)
    into owner_policy_count
    from pg_policies
   where schemaname = 'public'
     and tablename = 'v2_battle_records'
     and policyname in (
       'Owner can read V2 battles',
       'Owner can create V2 battles',
       'Owner can update V2 battles',
       'Owner can delete V2 battles'
     );

  if owner_policy_count <> 4 then
    raise exception 'Expected 4 named owner-only RLS policies; found %.', owner_policy_count;
  end if;

  select count(*)
    into trigger_count
    from pg_trigger
   where tgrelid = table_oid
     and tgname = 'v2_battle_records_updated_at'
     and not tgisinternal;

  if trigger_count <> 1 then
    raise exception 'Expected the updated_at trigger; found %.', trigger_count;
  end if;
end
$$;

-- Table columns and data types.
select column_name, data_type, is_nullable, column_default
  from information_schema.columns
 where table_schema = 'public'
   and table_name = 'v2_battle_records'
 order by ordinal_position;

-- RLS policies: verify command, role, and predicate expressions.
select policyname, cmd, roles, qual, with_check
  from pg_policies
 where schemaname = 'public'
   and tablename = 'v2_battle_records'
 order by policyname;

-- Indexes and the updated_at trigger.
select indexname, indexdef
  from pg_indexes
 where schemaname = 'public'
   and tablename = 'v2_battle_records'
 order by indexname;

select tgname, pg_get_triggerdef(oid) as trigger_definition
  from pg_trigger
 where tgrelid = 'public.v2_battle_records'::regclass
   and not tgisinternal;
