import { createGameState } from "../state/game-state.js";
import { createUnit } from "../state/unit.js";
import { createGameSession } from "../application/game-session.js";
import { registerCoreCommandHandlers } from "../engine/register-core-commands.js";
import { clearCommandHandlers } from "../engine/command-engine.js";
import { createBattleShell } from "./battle-shell.js";
import { bindLiveCasualtyControls } from './live-casualty-controls.js';
import { installTerritoryMapOverlay } from './territory-map-overlay.js';
import { COMPLETE_SECONDARY_MISSION_CATALOG } from "../data/secondary-mission-complete-catalog.js";
import { installV2SupabasePublicConfig } from "../persistence/supabase-runtime-config.js";
import { createSupabaseClientFromPublicConfig } from "../persistence/supabase-client.js";
import { startLiveApp } from '../application/live-startup.js';
import { createLocalBattleStore } from '../persistence/local-battle-store.js';
import { mountLiveSessionTools } from './live-session-tools.js';

clearCommandHandlers();
registerCoreCommandHandlers();

const gameData = {
  weapons: [
    {
      id: "rifle",
      name: "Bolt Rifle",
      type: "ranged",
      characteristics: { range: 24, attacks: 2, strength: 4, ap: -1, damage: 1 }
    },
    {
      id: "blade",
      name: "Power Blade",
      type: "melee",
      characteristics: { attacks: 2, strength: 5, ap: -2, damage: 2 }
    }
  ]
};

const state = createGameState({
  phase: "setup",
  turn: 0,
  activePlayer: "p1",
  players: [
    { id: "p1", name: "You" },
    { id: "p2", name: "Opponent" }
  ],
  battleSetup: { battleSize: "strike_force" },
  scoring: { turnSnapshots: [], secondaryMissionModeByPlayer: { p1: "tactical", p2: "tactical" } },
  battle: {
    id: "integrated-demo",
    status: "setup",
    round: 0,
    firstPlayerId: "p1",
    activePlayerId: "p1"
  },
  objectives: [],
  units: [
    createUnit({
      id: "intercessors",
      ownerId: "p1",
      name: "Intercessor Squad",
      status: "deployed",
      wounds: 10,
      position: { x: 0, y: 0 },
      profile: {
        weaponIds: ["rifle", "blade"],
        characteristics: { movement: 6, ballisticSkill: 3, weaponSkill: 3, toughness: 4, save: 3 }
      }
    }),
    createUnit({
      id: "captain",
      ownerId: "p1",
      name: "Captain",
      status: "deployed",
      wounds: 5,
      position: { x: 3, y: 0 },
      profile: {
        weaponIds: ["rifle", "blade"],
        characteristics: { ballisticSkill: 3, weaponSkill: 3, toughness: 4, save: 3 }
      }
    }),
    createUnit({
      id: "enemy",
      ownerId: "p2",
      name: "Enemy Guard",
      status: "deployed",
      wounds: 10,
      position: { x: 6, y: 0 },
      profile: {
        weaponIds: ["blade"],
        characteristics: { movement: 6, ballisticSkill: 4, weaponSkill: 4, toughness: 4, save: 4 }
      }
    })
  ]
});

const session = createGameSession(state);

function bindMissionSummaryToggle(root) {
  root?.addEventListener?.("click", (event) => {
    const summary = event.target?.closest?.(".battle-mission-summary__section > summary");
    if (!summary || !root.contains?.(summary)) return;
    // Handle exactly one toggle on Safari, even when another shell click handler
    // would also update the same <details> element.
    event.preventDefault?.();
    event.stopImmediatePropagation?.();
    summary.parentElement.open = !summary.parentElement.open;
  });
}

function initializeBattleDemo() {
  const layoutMode = new URLSearchParams(window.location.search).get("ui") === "classic"
    ? "classic"
    : "tabletop";
  const root = document.getElementById("battle-app");
  bindMissionSummaryToggle(root);
  installTerritoryMapOverlay(root, { session, perspectivePlayerId: "p1" });
  let tools;
  const app = startLiveApp({
    mount() {
      const shell = createBattleShell(root, {
    session,
    perspectivePlayerId: "p1",
    gameData,
    secondaryMissionCatalog: COMPLETE_SECONDARY_MISSION_CATALOG,
    layoutMode,
    onRender: () => tools?.refresh()
      });
      tools = mountLiveSessionTools({ root, session, store: createLocalBattleStore(), onRetryCloud: () => app.retryCloud() });
      return { connectCloud(client) { shell.connectCloud(client); tools.setCloudStatus('Cloud available'); } };
    },
    loadCloud() {
      tools.setCloudStatus('Cloud connecting…');
      installV2SupabasePublicConfig(window);
      return createSupabaseClientFromPublicConfig();
    },
    onCloudError() { tools.setCloudStatus('Cloud unavailable · local battle play remains available'); }
  });
  bindLiveCasualtyControls(root, { session });
}

void initializeBattleDemo();
