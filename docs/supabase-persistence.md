# V2 Supabase persistence foundation

## Scope

V2 uses a separate `public.v2_battle_records` table. It does not read or write V1's `battle_records` or `saved_army_lists` tables. The table stores a versioned JSONB snapshot and is protected by row-level security policies that bind every operation to the authenticated Supabase user (`auth.uid() = user_id`). No service-role key belongs in browser code.

## Setup

1. Create or select the Supabase project intended for V2.
2. Review and apply `supabase/migrations/202610100001_create_v2_battle_records.sql` in that project's SQL migration workflow.
3. Run `supabase/verify_v2_battle_records.sql` in the same project's SQL editor. It performs read-only checks for the table, RLS, all four owner policies, and the `updated_at` trigger, then displays the installed schema details.
4. Configure the browser runtime with the project's URL and publishable/anon key. The client factory reads `window.__40K_TACTICS_SUPABASE_CONFIG__ = { url: "https://YOUR_PROJECT.supabase.co", publishableKey: "YOUR_PUBLISHABLE_OR_ANON_KEY" }`. These values are public browser configuration; never put a service-role key here.
5. Enable Email/Password sign-in in Supabase Auth and provision one owner account in the Supabase dashboard. The app intentionally does not offer sign-up or separate accounts for the two tabletop players.
6. Call `createSupabaseClientFromPublicConfig()` from `src/persistence/supabase-client.js`, then pass its result as `supabaseClient` to `createBattleShell(...)`. The factory loads `@supabase/supabase-js` v2 from `https://esm.sh` by default; callers can inject a pinned SDK `createClient` function instead.
7. The integrated shell displays the owner sign-in panel. Once signed in, it creates the cloud save/list/load/delete panel using `createSupabaseBattleStore(client)`. RLS is the security boundary; adapter filters are defense in depth.

## Snapshot contract

- `state_version` must match `game_state.version`.
- The adapter currently loads only `GAME_STATE_VERSION` and fails clearly on unsupported versions; migration must be explicit rather than silently reshaping battle state.
- Snapshot JSON includes current players, units, phase/turn, objective and scoring state, timers, map state, and event history when those fields exist in the state object.
- The auth panel and cloud-save controls are available in `createBattleShell` when a configured Supabase client is supplied. The current `index.html` still launches the Fight demo and does not create the integrated shell; do not switch the entry point until setup, army/mission selection, and the full battle workflow are ready.

## Safety and deployment notes

- Apply the migration to the V2 Supabase project only after verifying the target project in its dashboard.
- The existing V1 configuration and schema are reference material, not a target to modify.
- RLS requires a valid authenticated session. The V2 UI should present a single-owner sign-in/configuration path, not player-account management.
- Validate the SQL migration in the target Supabase project before treating cloud persistence as production-ready.


## Deployment smoke test

After the migration verification passes and the public client configuration is available, test with the single owner account:

1. Sign in through the V2 shell and confirm the cloud-save panel appears.
2. Save a disposable test battle with a distinctive name.
3. Refresh the page/session, sign in again, and load that save.
4. Confirm phase, turn, player/unit state, reserves, planning and actual positions, objective/scoring ledgers, and history match the saved battle.
5. Update the same save, refresh the saved-battle list, then delete the disposable record.
6. Sign out and confirm cloud save controls are unavailable. A signed-out browser must not read or mutate the table.

Do not call this a successful live cloud test until it has been run against the intended V2 Supabase project. Automated GitHub Actions tests use mocks and do not prove project configuration or deployed RLS behavior.
