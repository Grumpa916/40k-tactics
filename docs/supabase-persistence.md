# V2 Supabase persistence foundation

## Scope

V2 uses a separate `public.v2_battle_records` table. It does not read or write V1's `battle_records` or `saved_army_lists` tables. The table stores a versioned JSONB snapshot and is protected by row-level security policies that bind every operation to the authenticated Supabase user (`auth.uid() = user_id`). No service-role key belongs in browser code.

## Setup

1. Create or select the Supabase project intended for V2.
2. Review and apply `supabase/migrations/202610100001_create_v2_battle_records.sql` in that project's SQL migration workflow.
3. Configure the browser app with the project's URL and publishable/anon key through a non-secret public configuration mechanism. Do not embed a service-role key.
4. Configure one owner account in Supabase Auth. The app does not need separate logins for the two tabletop players; the single owner account is only for cloud storage access.
5. Use `createSupabaseBattleStore(client)` for save/list/load/delete operations. RLS is the security boundary; adapter filters are defense in depth.

## Snapshot contract

- `state_version` must match `game_state.version`.
- The adapter currently loads only `GAME_STATE_VERSION` and fails clearly on unsupported versions; migration must be explicit rather than silently reshaping battle state.
- Snapshot JSON includes current players, units, phase/turn, objective and scoring state, timers, map state, and event history when those fields exist in the state object.
- This is the persistence adapter/schema foundation only. The current `index.html` still launches the Fight demo; wire save/load controls into the integrated battle shell after the setup entry point is established.

## Safety and deployment notes

- Apply the migration to the V2 Supabase project only after verifying the target project in its dashboard.
- The existing V1 configuration and schema are reference material, not a target to modify.
- RLS requires a valid authenticated session. The V2 UI should present a single-owner sign-in/configuration path, not player-account management.
- Validate the SQL migration in the target Supabase project before treating cloud persistence as production-ready.
