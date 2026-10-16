# Step 3 terrain integration

The integration combines the approved terrain branch at `78a8e170ace86de661498767ce016e1377f77f10` with the five-step setup/live-play branch at `16145076280b1b4712880eaf5326c613899e049a`. Neither source branch is replaced or reset.

Step 3 now uses `src/ui/terrain-placement-map.js`, extracted from the user-approved preview, and shared presentation rules in `terrain-placement-map-styles.js`. The preview uses the same code. The source values, terrain associations, canonical/mirror layers, and callout placement algorithm are unchanged.

The selected Force Dispositions and Layout A/B/C resolve the Event Companion page. Only approved pages can render in setup. All 45 pages (9–53) have approval. Step 3 hides units and coordinate rulers, retains blue-bottom orientation, and offers terrain focus and Show all/Hide all. Focus survives fullscreen changes and rerenders on the same map. Changing maps clears focus; leaving Step 3 closes fullscreen. Fullscreen preserves the board's 44:60 proportions.

Removed obsolete Step 3 compressed-label loading and corrected the duplicate navigation helpers that restored stale step labels after tab switches. Step order remains Armies → Mission & Planning → Terrain Setup → Pre-First Turn → Deploy and Begin.

Validation: 958 Node tests passed, including 47 new integration tests covering all 45 maps, guide equality with the approved model, terrain focus, keyboard activation, Show/Hide all, restored focus, missing-map handling, and fullscreen exit without battle-state mutation. All 39 candidate audit entries pass. A cloud-browser attempt timed out, and no new browser or iPad/Safari visual pass is claimed.

## Cloudflare verification and play fixes

Live deployment: https://40k-tactics.pages.dev. The user confirmed app loading, Supabase sign-in and saved-army loading, Step 3 measurements and expanded map, Step 4, Step 5, first-player battle start and clock, clock pause/resume, and save/resume. Actual turn handover remains under user testing.

The original app lacked a recorded-phase advancement button. A shared phase progression panel now dispatches the existing phase/turn/round commands, preserves scoring prompts, and distinguishes browsing from advancing.

The next playtest found that every deployed unit blocked Shooting completion and opponent movement remained tied to the fixed user perspective. Added a Do not shoot choice, automatic nonblocking handling for confirmed melee-only loadouts (optional Actions remain available), and active-player movement controls with fixed perspective colors. Missing or unresolved weapon data remains unknown and can use Do not shoot. Saved roster Movement values can fill missing live profiles without guessing stats.

Validation after these fixes: 969 tests passed, zero failures. The latest ZIP and cumulative patch contain the integration and both fixes. GitHub remains blocked; no GitHub CI or merge is claimed.
