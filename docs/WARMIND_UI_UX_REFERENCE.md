# Warmind Army Builder — UI/UX Reference for 40K Tactics V2

**Reference date:** October 7, 2026  
**Reference app:** Warmind Army Builder by Derek Moore  
**Purpose:** Preserve UI/UX observations and design decisions from the Warmind comparison so they can be reused in future development chats.

## Product-level conclusion

Warmind is a strong army-building and battle-management application. 40K Tactics V2 should use it as a UI/UX benchmark, not as a product blueprint.

The defining V2 differentiation remains:

> A live 40K tactical assistant that records meaningful authoritative game state with minimal player input and uses that history to provide tactical advice.

Warmind validates the basic low-friction combat interaction we are pursuing, but V2 should go further by combining combat entry with authoritative history and Tactical Advisor decision support.

## Ideas/features to consider implementing

### High priority

- Landscape two-panel workflow.
  - Left: My Army / relevant units / battle context.
  - Right: selected unit, current operation, unit reference, or Tactical Advisor.
  - Goal: reduce navigation and keep context visible.
- Persistent unit reference.
  - Select a unit and show its full reference beside the list.
  - Include stats, weapons, abilities, wounds/status, reserve/deployed/dead state, engagement state, and activation state where relevant.
- Large touch-friendly controls.
  - iPad-first.
  - Large readable controls and generous touch targets.
  - Consistent button placement.
- Minimal taps and minimal typing.
- Persistent battle context.
  - Keep the player's current decision and the information needed to make that decision in the same view whenever practical.
- Tactical Advisor in the contextual panel.
  - The selected-unit/reference area can eventually become an intelligent decision-support panel.
  - Potential information: expected damage, return damage, objective impact, risk, activation state, engagement, and recommendation.

### Medium priority

- Unit category filtering for roster construction.
- A-Z sorting where useful.
- Mission-selection presentation inspired by Warmind's matchup/relationship presentation.
  - Prefer meaningful choices and consequences over raw database browsing.
- Contextual rules and stratagem presentation.
  - Rule name, timing, CP cost, eligibility, restrictions.
  - Eventually allow the Tactical Advisor to surface relevant rules automatically.

### Already adopted / validated

- Activation history.
- Combat history.
- Attacker -> Weapon -> Target -> Actual Damage.
- Expected damage calculated automatically by the engine.
- Opponent activation support.
- Low-friction Fight workflow.

## Features/design approaches to avoid

- Becoming another army-builder ecosystem.
  - Community, clubs, events, collection management, and social features are not current priorities.
- Excessive navigation during live play.
- Excessive data entry.
- Individual dice-roll entry.
- Requiring the player to enter every modifier, hit roll, wound roll, save roll, or other unnecessary detail.
- Using map coordinates as authoritative rules logic.
  - Map coordinates remain spatial/tactical context only.
  - History + rules engine remain legal authority.
- Overloading the live Battle screen with every available rule, statistic, ability, and history item.
- Building a statistics system before the authoritative tactical-history foundation is mature.
- Copying Warmind's visual identity wholesale.
  - Borrow hierarchy, interaction patterns, and information organization rather than its exact styling.
- Rebuilding already-working combat architecture because of the Warmind comparison.
  - Do not redesign Fight activation, engagement state, combat resolution, actual damage recording, expected damage calculation, split attacks, or opponent activation support merely to resemble Warmind.

## Key UI principle

> Keep the player's current decision and the information needed to make that decision in the same view whenever practical.

Example:

Avoid:
Fight -> select unit -> open reference -> back -> select target -> enter damage.

Prefer:
Fight -> select unit -> reference/Advisor appears beside Fight controls -> select target -> enter damage.

## Suggested future landscape model

```
+-------------------------------------------------------+
| Battle / Army context                                 |
+---------------------+---------------------------------+
| MY ARMY             | SELECTED UNIT / CURRENT ACTION |
|                     |                                 |
| Captain             | Unit reference                  |
| Intercessors        | Stats                           |
| Terminators         | Weapons                         |
| Tyrannofex          | Abilities                       |
| ...                 | Tactical state                  |
|                     | Tactical Advisor                |
| Rules / Objectives  | Combat controls                 |
+---------------------+---------------------------------+
```

This is a conceptual reference only. It is not a commitment to implement the exact layout.

## Development sequencing decision

The Warmind comparison must not interrupt current engine work.

Preferred sequence:

1. Continue Fight/engagement foundation only where rules refinement is genuinely necessary.
2. Build minimum authoritative opponent-turn history:
   - opponent Shooting
   - opponent Charge
   - opponent Fight
   - resulting wounds/status
   - engagement changes
3. Begin consuming that history for Tactical Advisor foundations.
4. Build contextual Tactical Advisor UI.
5. Use this Warmind reference when refining the broader landscape UI.


## Battle Setup comparison — additional reference

The additional October 7, 2026 screenshots show Warmind's full Battle Setup flow. The user correctly noted that this looks similar to the earlier V1 setup experience.

### Ideas to consider adopting

#### 1. Setup progress/navigation
Warmind organizes setup into explicit stages:

1. Game Size
2. Muster Armies
3. Determine Mission
4. Create Battlefield
5. Attacker/Defender
6. Secondary Missions
7. Deploy and Begin

Useful concepts to consider:
- visible setup progress
- clear section titles
- strong indication of required information
- a final readiness gate
- a "Show All" option so experienced players can avoid rigid navigation

**Decision:** Consider the staged/checklist concept, but do not automatically reproduce seven sequential screens.

#### 2. Setup validation
Warmind clearly identifies missing requirements such as:
- army disposition
- opponent name
- opponent faction
- opponent detachment/disposition
- first turn
- other pre-battle choices

**Decision: Adopt the principle.** V2 should make missing information obvious and prevent an invalid battle from silently starting.

#### 3. Opponent roster entry options
Warmind offers:
- Scan QR
- Auto Sync
- Paste Their List
- Choose From My Rosters
- opponent name
- opponent faction

**Decision: Consider later.** The concept of giving the player several low-friction ways to establish opponent state is valuable for Tactical Advisor data quality. QR/auto-sync integration is not a current engine priority.

#### 4. Terrain layout preview
Warmind presents the selected terrain layout visually and allows the map to be enlarged.

**Decision: Adopt the concept.** A large, readable terrain/setup diagram is valuable on iPad and aligns with previous V2 UI observations.

#### 5. Terrain legend
Warmind provides a clear visual key for:
- dense terrain
- light terrain
- terrain plates
- single terrain areas
- separate terrain areas
- home objective
- central objective
- expansion objective

**Decision: Strongly consider.** This is useful because it converts a complicated terrain diagram into something understandable without requiring the player to remember symbols.

#### 6. Pre-battle checklist
Warmind explicitly lists:
- declare battle formations
- deploy armies
- determine who goes first
- resolve pre-battle rules

**Decision: Adopt the concept.** V2 should eventually provide a concise pre-battle checklist, while keeping the actual workflow compatible with our existing deployment decisions.

### Things to avoid

#### 1. Recreating a long linear setup wizard just because Warmind uses one
The screenshots resemble V1's setup structure. That similarity is informative, but it does not mean V2 should return to a cumbersome wizard.

**Decision: Avoid unnecessary sequential screens.**

Prefer:
- compact setup sections
- visible progress
- Show All / overview capability
- validation
- direct access to the item that needs attention

#### 2. Forcing unnecessary setup data
Do not require information merely because another application collects it.

Every setup field should answer:
> Does this information materially improve game-state accuracy, rules validation, scoring, or Tactical Advisor capability?

If not, it should not become mandatory.

#### 3. Treating terrain/map imagery as legal authority
Terrain diagrams are useful for setup and tactical context, but the same architectural rule applies:
- visual map = context
- rules/state = authority

#### 4. Letting setup UI drive engine architecture
Battle Setup should consume authoritative game state and commands. It should not become a parallel rules system.

## Battle Setup design direction for V2

The strongest combination of the Warmind reference and our existing V2 goals is:

**Compact Setup Overview**
→ **required-state validation**
→ **terrain/mission context**
→ **deployment**
→ **pre-battle checklist**
→ **Begin Battle**

Experienced players should be able to move quickly through setup, while newer players can see what remains unresolved.

The setup experience should feel like a **checklist with context**, not a seven-page form.


## Reference screenshots

The October 7, 2026 Warmind screenshots supplied during the comparison showed:

- Home/dashboard
- New Roster
- Add Unit
- Tyranids roster/editor
- Army rules and stratagems
- Primary Missions
- Fight Phase

The screenshots are the visual source for the observations in this document.
