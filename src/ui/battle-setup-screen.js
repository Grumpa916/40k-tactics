import { COMMAND_TYPES } from "../commands/game-commands.js";
import { SCORING_TIMINGS } from "../rules/mission-definition.js";
import { getSecondaryMissionHistory, getSecondaryMissionMode, SECONDARY_MISSION_STATUS } from "../rules/secondary-mission-lifecycle.js";
import { getPreGameAbilityRules, getPreGameProcedureSteps } from "../rules/pre-game-procedure.js";
import { evaluatePreGameReadiness } from "../rules/pre-game-readiness.js";
import { renderBattlefieldMap } from "./battlefield-map.js";
import { loadEventCompanionEdgeMeasurements } from "../data/event-companion-edge-measurements.js";
import { EVENT_COMPANION_MAP_CATALOG } from "../data/event-companion-map-catalog.js";
import { SECONDARY_MISSION_CATALOG } from "../data/secondary-mission-catalog.js";
import { getLayoutOptionsForForceDispositions } from "../rules/event-companion-map-catalog.js";

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

const MANUAL_TIMINGS = Object.freeze([
  [SCORING_TIMINGS.COMMAND_PHASE, "End of Command phase"],
  [SCORING_TIMINGS.END_OF_TURN, "End of turn"],
  [SCORING_TIMINGS.END_OF_OPPONENT_TURN, "End of opponent's turn"],
  [SCORING_TIMINGS.END_OF_BATTLE, "End of battle"]
]);

export function createBattleSetupScreen(container, {
  session,
  perspectivePlayerId = null,
  missionDefinitions = [],
  secondaryMissionCatalog = [],
  setupTab = "pre-game"
} = {}) {
  if (!container || typeof container.replaceChildren !== "function") {
    throw new TypeError("A browser container element is required.");
  }
  if (!session || typeof session.getState !== "function" || typeof session.subscribe !== "function") {
    throw new TypeError("A game session is required.");
  }

  let selectedPlayerId = null;
  let selectedPlanUnitId = null;
  let planningPointerDrag = null;
  let activeSetupTab = ["pre-game", "mission-map", "battlefield"].includes(setupTab) ? setupTab : "pre-game";
  let message = "";
  let battlefieldMapFullscreen = false;
  let screenDestroyed = false;
  let edgeMeasurementsByPage = {};
  const configuredSecondaryCatalog = secondaryMissionCatalog.length
    ? secondaryMissionCatalog
    : SECONDARY_MISSION_CATALOG;

  function handleChange(event) {
    const target = event.target;
    if (target?.matches?.("[data-event-companion-disposition]")) {
      const state = session.getState();
      const current = state.battlefieldMap?.missionSetup ?? {};
      const kind = target.getAttribute("data-event-companion-disposition");
      const myDisposition = kind === "my" ? (target.value || null) : (current.myDisposition ?? null);
      const opponentDisposition = kind === "opponent" ? (target.value || null) : (current.opponentDisposition ?? null);
      try {
        session.dispatch({ type: COMMAND_TYPES.SET_EVENT_COMPANION_MISSION_SETUP, payload: {
          myDisposition, opponentDisposition, layout: "A"
        }});
        message = myDisposition && opponentDisposition
          ? "Primary Missions resolved. Choose battlefield layout A, B, or C."
          : "Select the other army’s Force Disposition to resolve both Primary Missions.";
      } catch (error) {
        message = error?.message ?? String(error);
      }
      render();
      return;
    }
    if (target?.matches?.("[data-setup-secondary-mode]")) {
      if (!target.value) return;
      try {
        const playerId = target.getAttribute("data-setup-secondary-mode") || selectedPlayerId;
        if (!playerId) throw new Error("Could not identify the player whose secondary mode you are setting.");
        session.dispatch({ type: COMMAND_TYPES.SET_SECONDARY_MISSION_MODE, payload: { mode: target.value, playerId } });
        message = "Secondary mode set to " + target.value + " for " + (session.getState().players?.find((player) => player.id === playerId)?.name ?? playerId) + ".";
      } catch (error) {
        message = error?.message ?? String(error);
      }
      render();
      return;
    }

  }

  function mapCoordinates(board, x, y) {
    const r=board?.getBoundingClientRect?.();if(!r||!r.width||!r.height)return null;
    return {x:Math.round(Math.max(0,Math.min(60,(x-r.left)/r.width*60))*10)/10,y:Math.round(Math.max(0,Math.min(44,(1-(y-r.top)/r.height)*44))*10)/10};
  }
  function handlePlanningPointerDown(e) {
    const m=e.target?.closest?.("[data-map-unit-id]");if(!m||!m.closest?.('[data-map-mode="planning"]'))return;
    const b=m.closest("[data-battlefield-map-board]");if(!b)return;selectedPlanUnitId=m.getAttribute("data-map-unit-id");e.preventDefault?.();
    planningPointerDrag={unitId:selectedPlanUnitId,pointerId:e.pointerId,startX:e.clientX,startY:e.clientY,board:b,marker:m,left:m.style.left,top:m.style.top,moved:false};
    m.classList?.add?.("is-dragging");try{m.setPointerCapture?.(e.pointerId);}catch{}
  }
  function handlePlanningPointerMove(e) {
    const d=planningPointerDrag;if(!d||d.pointerId!==e.pointerId)return;
    if(Math.hypot(e.clientX-d.startX,e.clientY-d.startY)>=8)d.moved=true;if(!d.moved)return;
    const p=mapCoordinates(d.board,e.clientX,e.clientY);if(!p)return;e.preventDefault?.();d.marker.style.left=p.x/60*100+"%";d.marker.style.top=(44-p.y)/44*100+"%";
  }
  function handlePlanningPointerUp(e) {
    const d=planningPointerDrag;if(!d||d.pointerId!==e.pointerId)return;planningPointerDrag=null;d.marker.classList?.remove?.("is-dragging");
    if(!d.moved){render();return;}const p=mapCoordinates(d.board,e.clientX,e.clientY),u=(session.getState().units??[]).find(x=>x.id===d.unitId);
    if(!p||!u?.ownerId){render();return;}
    try{session.dispatch({type:COMMAND_TYPES.SET_DEPLOYMENT_PLAN_POSITION,payload:{unitId:d.unitId,playerId:u.ownerId,position:p}});message="Planned position saved";}
    catch(err){message=err?.message??String(err);}render();
  }
  function handlePlanningPointerCancel(e) {
    const d=planningPointerDrag;if(!d||d.pointerId!==e.pointerId)return;planningPointerDrag=null;d.marker.classList?.remove?.("is-dragging");d.marker.style.left=d.left;d.marker.style.top=d.top;render();
  }

  function handleClick(event) {
    const roleButton = event.target?.closest?.("[data-pre-game-role-choice]");
    if (roleButton) {
      const state = session.getState();
      const current = state.preGameSetup ?? {};
      const kind = roleButton.getAttribute("data-pre-game-role-choice");
      const nextValue = roleButton.getAttribute("data-player-id") || null;
      const attackerPlayerId = kind === "attackerPlayerId" ? nextValue : (current.attackerPlayerId ?? null);
      const firstPlayerId = kind === "firstPlayerId" ? nextValue : (current.firstPlayerId ?? null);
      try {
        session.dispatch({ type: COMMAND_TYPES.SET_PRE_GAME_ROLES, payload: { attackerPlayerId, firstPlayerId }});
        message = "Battle roles saved. Defender is automatically the other army.";
      } catch (error) { message = error?.message ?? String(error); }
      render();
      return;
    }
    const fullscreenButton = event.target?.closest?.("[data-toggle-battlefield-fullscreen]");
    if (fullscreenButton) {
      battlefieldMapFullscreen = !battlefieldMapFullscreen;
      render();
      return;
    }
    const dispositionButton = event.target?.closest?.("[data-event-companion-disposition-choice]");
    if (dispositionButton) {
      const state = session.getState();
      const current = state.battlefieldMap?.missionSetup ?? {};
      const kind = dispositionButton.getAttribute("data-event-companion-disposition-choice");
      const value = dispositionButton.getAttribute("data-disposition-value");
      const myDisposition = kind === "my" ? value : (current.myDisposition ?? null);
      const opponentDisposition = kind === "opponent" ? value : (current.opponentDisposition ?? null);
      try {
        session.dispatch({ type: COMMAND_TYPES.SET_EVENT_COMPANION_MISSION_SETUP, payload: {
          myDisposition, opponentDisposition, layout: "A"
        }});
        message = myDisposition && opponentDisposition
          ? "Primary Missions resolved. Choose battlefield layout A, B, or C."
          : "Disposition recorded. Select the other army’s Force Disposition.";
      } catch (error) {
        message = error?.message ?? String(error);
      }
      render();
      return;
    }
    const layoutButton = event.target?.closest?.("[data-event-companion-layout]");
    if (layoutButton) {
      const layout = layoutButton.getAttribute("data-event-companion-layout");
      const setup = session.getState().battlefieldMap?.missionSetup;
      if (!setup?.myDisposition || !setup?.opponentDisposition) {
        message = "Choose both Force Dispositions before selecting a layout.";
        render();
        return;
      }
      try {
        session.dispatch({ type: COMMAND_TYPES.SET_EVENT_COMPANION_MISSION_SETUP, payload: {
          myDisposition: setup.myDisposition, opponentDisposition: setup.opponentDisposition, layout
        }});
        message = "Layout " + layout + " selected. Verified terrain, deployment zones, and objectives are shown on the map.";
      } catch (error) {
        message = error?.message ?? String(error);
      }
      render();
      return;
    }
    const mapUnit = event.target?.closest?.("[data-map-unit-id]");
    if (mapUnit && mapUnit.closest?.('[data-map-mode="planning"]')) {
      selectedPlanUnitId = mapUnit.getAttribute?.("data-map-unit-id") ?? mapUnit.dataset?.mapUnitId ?? null;
      message = selectedPlanUnitId ? "Selected planned unit. Tap an empty point on the map to reposition it." : "";
      render();
      return;
    }
    const mapBoard = event.target?.closest?.("[data-battlefield-map-board]");
    if (mapBoard && mapBoard.closest?.('[data-map-mode="planning"]')) {
      const state = session.getState();
      const playerId = perspectivePlayerId ?? state.activePlayer ?? state.players?.[0]?.id ?? null;
      if (!selectedPlanUnitId) {
        message = "Select one of your units before placing it on the planning map.";
        render();
        return;
      }
      const rect = mapBoard.getBoundingClientRect?.();
      if (!rect || !rect.width || !rect.height || !Number.isFinite(event.clientX) || !Number.isFinite(event.clientY)) {
        message = "Map position could not be measured. Use the coordinate fallback when available.";
        render();
        return;
      }
      const x = Math.round(Math.max(0, Math.min(60, (event.clientX - rect.left) / rect.width * 60)) * 10) / 10;
      const y = Math.round(Math.max(0, Math.min(44, (1 - (event.clientY - rect.top) / rect.height) * 44)) * 10) / 10;
      try {
        session.dispatch({ type: COMMAND_TYPES.SET_DEPLOYMENT_PLAN_POSITION, payload: {
          unitId: selectedPlanUnitId, playerId, position: { x, y }
        }});
        message = "Planned position recorded. Select another unit or move this marker.";
      } catch (error) {
        message = error?.message ?? String(error);
      }
      render();
      return;
    }
    const clearPlan = event.target?.closest?.("[data-clear-deployment-plan]");
    if (clearPlan) {
      const state = session.getState();
      const playerId = perspectivePlayerId ?? state.activePlayer ?? state.players?.[0]?.id ?? null;
      try {
        session.dispatch({ type: COMMAND_TYPES.CLEAR_DEPLOYMENT_PLAN, payload: { playerId } });
        selectedPlanUnitId = null;
        message = "Your deployment plan was cleared.";
      } catch (error) {
        message = error?.message ?? String(error);
      }
      render();
      return;
    }
    const selectPlan = event.target?.closest?.("[data-planning-unit-select]");
    if (selectPlan) {
      selectedPlanUnitId = selectPlan.value || null;
      message = selectedPlanUnitId ? "Unit selected. Tap the map to set its planned position." : "";
      render();
      return;
    }
    const target = event.target?.closest?.("[data-setup-fixed-add]");
    if (!target || !container.contains(target)) return;
    const state = session.getState();
    const playerId = target.getAttribute("data-setup-fixed-add") || selectedPlayerId;
    const playerPanel = target.closest?.("[data-secondary-player-panel]") ?? container;
    const field = (selector) => playerPanel.querySelector?.(selector) ?? container.querySelector(selector);
    if (state.battle) {
      message = "Fixed secondary cards must be selected before the battle starts.";
      render();
      return;
    }
    if (!playerId || getSecondaryMissionMode(state, playerId) !== "fixed") {
      message = "Choose Fixed mode for this player before selecting Fixed secondary cards.";
      render();
      return;
    }
    const definitionId = field("[data-setup-secondary-definition]")?.value;
    const manualName = String(field("[data-setup-secondary-name]")?.value ?? "").trim();
    const manualTiming = field("[data-setup-secondary-timing]")?.value;
    // Always provide the shipped 2026–27 card catalog when the caller does
    // not inject one. An explicitly supplied catalog extends/replaces the
    // defaults by ID, so the selector cannot silently render empty.
    const suppliedSecondaryCatalog = secondaryMissionCatalog.length
      ? secondaryMissionCatalog
      : SECONDARY_MISSION_CATALOG;
    const definitions = [
      ...missionDefinitions.filter((item) => item?.category === "secondary"),
      ...suppliedSecondaryCatalog.filter((item) => item?.category === "secondary" &&
        !missionDefinitions.some((configured) => configured?.id === item.id))
    ];
    const configured = definitions.find((item) => item.id === definitionId);
    const catalog = (secondaryMissionCatalog.length ? secondaryMissionCatalog : SECONDARY_MISSION_CATALOG)
      .find((item) => item.id === definitionId && item.category === "secondary");
    const allowedTimings = MANUAL_TIMINGS.map(([timing]) => timing);
    let definition;

    if (configured) {
      if (configured.fixedAvailable === false ||
          (Array.isArray(configured.availableModes) && !configured.availableModes.includes("fixed"))) {
        message = "That secondary card is not available in Fixed mode.";
        render();
        return;
      }
      if ((!Array.isArray(configured.scoringWindows) || configured.scoringWindows.length === 0) &&
          !allowedTimings.includes(manualTiming)) {
        message = "Choose the scoring checkpoint from the physical card before recording it.";
        render();
        return;
      }
      definition = {
        ...configured,
        timing: configured.scoringWindows?.[0]?.timing ?? manualTiming,
        conditions: [],
        manualEntry: true
      };
    } else if (manualName) {
      const normalizedName = manualName.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
      const matchingCatalog = (secondaryMissionCatalog.length ? secondaryMissionCatalog : SECONDARY_MISSION_CATALOG).find((item) =>
        item.category === "secondary" &&
        item.name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim() === normalizedName);
      if (!matchingCatalog?.fixedAvailable) {
        message = "Fixed mode only permits cards marked as Fixed-available in the catalog.";
        render();
        return;
      }
      if ((!Array.isArray(matchingCatalog.scoringWindows) || matchingCatalog.scoringWindows.length === 0) &&
          !allowedTimings.includes(manualTiming)) {
        message = "Choose the scoring checkpoint from the physical card before recording it.";
        render();
        return;
      }
      definition = {
        ...matchingCatalog,
        timing: matchingCatalog.scoringWindows?.[0]?.timing ?? manualTiming,
        conditions: [],
        manualEntry: true
      };
    } else {
      message = "Select a Fixed card from the catalog or enter its printed name.";
      render();
      return;
    }

    if (!playerId) {
      message = "Select the player whose two Fixed cards are being recorded.";
      render();
      return;
    }
    try {
      session.dispatch({ type: COMMAND_TYPES.DRAW_SECONDARY_MISSION, payload: {
        definition, playerId, round: 0, turn: 0
      }});
      selectedPlayerId = playerId;
      message = "Fixed card recorded for " + playerId + ". Select the player's second card, or choose the other player.";
    } catch (error) {
      message = error?.message ?? String(error);
    }
    render();
  }

  function render() {
    const state = session.getState();
    const players = Array.isArray(state.players) ? state.players : [];
    if (!selectedPlayerId || !players.some((player) => player.id === selectedPlayerId)) {
      selectedPlayerId = perspectivePlayerId ?? state.activePlayer ?? players[0]?.id ?? null;
    }
    const mode = getSecondaryMissionMode(state, selectedPlayerId) ?? "";
    const preGameSetup = state.preGameSetup ?? {};
    const attacker = players.find((player) => player.id === preGameSetup.attackerPlayerId);
    const defender = players.find((player) => player.id === preGameSetup.defenderPlayerId);
    const roleButtons = (kind, selectedId) => players.map((player) =>
      '<button type="button" class="pre-game-role-choice' + (player.id === selectedId ? ' is-selected' : '') +
      '" data-pre-game-role-choice="' + kind + '" data-player-id="' + escapeHtml(player.id) + '"' +
      (state.battle && state.battle.status !== "setup" ? ' disabled' : '') +
      ' aria-pressed="' + String(player.id === selectedId) + '">' + escapeHtml(player.name ?? player.id) + '</button>'
    ).join("");
    const preGameRolesMarkup = '<section class="pre-game-roles"><h2>Battle roles</h2>' +
      '<p>Tap a player for each choice. The defender is automatically the other army.</p>' +
      '<h3>Who is the attacker?</h3><div class="pre-game-role-choices" role="group" aria-label="Choose attacker">' +
      roleButtons("attackerPlayerId", preGameSetup.attackerPlayerId) + '</div>' +
      '<p><strong>Defender:</strong> ' + escapeHtml(defender?.name ?? (attacker ? "Automatically assigned to the other army" : "Choose the attacker above")) + '</p>' +
      '<h3>Who takes the first turn?</h3><div class="pre-game-role-choices" role="group" aria-label="Choose first player">' +
      roleButtons("firstPlayerId", preGameSetup.firstPlayerId) + '</div></section>';
    const missionSetup = state.battlefieldMap?.missionSetup ?? {};
    const layoutOptions = missionSetup.myDisposition && missionSetup.opponentDisposition
      ? getLayoutOptionsForForceDispositions(missionSetup.myDisposition, missionSetup.opponentDisposition)
      : null;
    const missionSetupMarkup = '<section class="event-companion-mission-setup"><h2>Primary Missions &amp; Battlefield</h2>' +
      '<p>Choose each army’s Force Disposition. The app resolves both Primary Missions using the verified Event Companion matrix.</p>' +
      '<div class="event-companion-disposition-groups">' +
      '<fieldset class="event-companion-disposition-group"><legend>Your army Force Disposition</legend><div class="event-companion-disposition-options">' +
      EVENT_COMPANION_MAP_CATALOG.forceDispositions.map((item) =>
        '<button type="button" data-event-companion-disposition-choice="my" data-disposition-value="' + escapeHtml(item) +
        '" aria-pressed="' + String(item === missionSetup.myDisposition) + '"' +
        (state.battle && state.battle.status !== "setup" ? ' disabled' : '') + '>' + escapeHtml(item) + '</button>').join("") +
      '</div></fieldset><fieldset class="event-companion-disposition-group"><legend>Opponent Force Disposition</legend><div class="event-companion-disposition-options">' +
      EVENT_COMPANION_MAP_CATALOG.forceDispositions.map((item) =>
        '<button type="button" data-event-companion-disposition-choice="opponent" data-disposition-value="' + escapeHtml(item) +
        '" aria-pressed="' + String(item === missionSetup.opponentDisposition) + '"' +
        (state.battle && state.battle.status !== "setup" ? ' disabled' : '') + '>' + escapeHtml(item) + '</button>').join("") +
      '</div></fieldset></div>' +
      (layoutOptions ? '<div class="event-companion-missions"><p><strong>Your Primary Mission:</strong> ' + escapeHtml(layoutOptions.myMission) +
        '</p><p><strong>Opponent Primary Mission:</strong> ' + escapeHtml(layoutOptions.opponentMission) + '</p>' +
        '<h3>Choose battlefield layout</h3><div role="group" aria-label="Battlefield layout choices">' +
        layoutOptions.layouts.map((item) => '<button type="button" data-event-companion-layout="' + item.layout + '" aria-pressed="' +
          (item.layout === missionSetup.layout ? 'true' : 'false') + '"' +
          (state.battle && state.battle.status !== "setup" ? " disabled" : "") + '>Layout ' + item.layout +
          ' · p. ' + item.page + (item.layout === missionSetup.layout ? ' — Selected' : '') + '</button>').join("") +
        '</div><p>Source pages refer to the official Event Companion. The map shows the verified terrain footprints, deployment zones, and objective locations for the selected layout.</p>' +
        renderBattlefieldMap(state, { mode: "planning", perspectivePlayerId: perspectivePlayerId ?? state.activePlayer ?? players[0]?.id, selectedUnitId: selectedPlanUnitId, showUnits: false }) +
        '</div>' :
        '<p>Choose both dispositions to reveal the two Primary Missions and three available layouts.</p>') +
      '</section>';
    const preGameMarkup = missionSetupMarkup;
    const history = getSecondaryMissionHistory(state);
    const fixedHistory = history.filter((item) =>
      item.definition?.missionMode === "fixed" && item.status === SECONDARY_MISSION_STATUS.ACTIVE);
    const definitions = [
      ...missionDefinitions.filter((item) => item?.category === "secondary"),
      ...configuredSecondaryCatalog.filter((item) => item?.category === "secondary" &&
        !missionDefinitions.some((configured) => configured?.id === item.id))
    ];
    const timingOptions = '<option value="">Choose checkpoint from card...</option>' +
      MANUAL_TIMINGS.map(([value, label]) =>
        '<option value="' + value + '">' + label + '</option>').join("");
    const secondaryPlayerPanels = players.map((player) => {
      const playerMode = getSecondaryMissionMode(state, player.id) ?? "";
      const playerHistory = history.filter((item) => item.playerId === player.id);
      const fixedCards = playerHistory.filter((item) =>
        item.definition?.missionMode === "fixed" && item.status === SECONDARY_MISSION_STATUS.ACTIVE);
      const fixedCount = fixedCards.length;
      const activeForPlayer = new Set(fixedCards.map((item) => item.definitionId));
      const fixedOptions = '<option value="">Select a Fixed card...</option>' + definitions
        .filter((item) => item.fixedAvailable === true ||
          (Array.isArray(item.availableModes) && item.availableModes.includes("fixed")))
        .filter((item) => !activeForPlayer.has(item.id))
        .map((item) => '<option value="' + escapeHtml(item.id) + '">' +
          escapeHtml(item.name ?? item.id) + '</option>').join("");
      const cardsList = fixedCards.length
        ? fixedCards.map((item) => '<li>' + escapeHtml(item.definition?.name ?? item.definitionId) + '</li>').join("")
        : '<li>No Fixed cards selected</li>';
      const modeGuidance = playerMode === "fixed"
        ? '<p>Choose two Fixed-available cards for this player. Each card can score repeatedly and is capped at 20 VP.</p>'
        : playerMode === "tactical"
          ? '<p>Draw and record Tactical cards manually from the physical deck on this player’s Command phase. Scoring and discards remain manually confirmed.</p>'
          : '<p>Choose this player’s mode independently of the opponent.</p>';
      const modeLocked = playerHistory.length > 0;
      const fixedMarkup = playerMode === "fixed" && !state.battle
        ? '<div class="command-vp-form"><label>Fixed card<select data-setup-secondary-definition>' + fixedOptions + '</select></label>' +
          '<label>Checkpoint if not verified<select data-setup-secondary-timing>' + timingOptions + '</select></label>' +
          '<label>Or type the printed card name<input data-setup-secondary-name maxlength="160" placeholder="Fixed card name"></label>' +
          '<button type="button" data-setup-fixed-add="' + escapeHtml(player.id) + '"' +
          (fixedCount >= 2 ? ' disabled' : '') + '>Record Fixed card for ' + escapeHtml(player.name ?? player.id) + '</button></div>' +
          '<h4>Fixed cards (' + fixedCount + '/2)</h4><ol>' + cardsList + '</ol>'
        : playerMode === "fixed"
          ? '<p>Fixed cards must be selected before battle start. Recorded cards remain active.</p><ol>' + cardsList + '</ol>'
          : '';
      return '<section class="secondary-player-panel" data-secondary-player-panel="' + escapeHtml(player.id) + '">' +
        '<h3>' + escapeHtml(player.name ?? player.id) + '</h3>' +
        '<label>Secondary mission mode<select data-setup-secondary-mode="' + escapeHtml(player.id) + '"' +
        (modeLocked ? ' disabled' : '') + ' required><option value="">Choose Fixed or Tactical...</option>' +
        '<option value="fixed"' + (playerMode === "fixed" ? ' selected' : '') + '>Fixed</option>' +
        '<option value="tactical"' + (playerMode === "tactical" ? ' selected' : '') + '>Tactical</option></select></label>' +
        modeGuidance + fixedMarkup + '</section>';
    }).join("");
    const selectedLayoutOption = layoutOptions?.layouts.find((item) => item.layout === missionSetup.layout);
    const terrainReferenceMarkup = selectedLayoutOption
      ? renderBattlefieldMap(state, {
          mode: "planning",
          perspectivePlayerId: perspectivePlayerId ?? state.activePlayer ?? players[0]?.id,
          showUnits: false,
          showMeasurements: false,
          showTerrainEdgeMeasurements: true,
          terrainMeasurements: edgeMeasurementsByPage[String(selectedLayoutOption.page)] ?? [],
          mapLabel: "Terrain placement reference"
        })
      : '<div class="terrain-reference-missing"><strong>Verified digital terrain layout unavailable.</strong>' +
        '<p>Select both Force Dispositions and a valid Layout A, B, or C.</p></div>';
    const battlefieldMarkup = '<style>.battlefield-map-section{min-width:0}.battlefield-map-section.is-fullscreen{position:fixed;inset:0;z-index:9999;overflow:auto;box-sizing:border-box;padding:12px;background:#101820}.battlefield-map-section [data-battlefield-map]{width:100%}.battlefield-map-section .battlefield-map__board{max-height:72vh}.battlefield-map-section.is-fullscreen .battlefield-map__board{height:calc(100vh - 150px);min-height:55vh;max-height:none;aspect-ratio:auto}.terrain-reference-missing{padding:24px;border:1px solid #596879;border-radius:8px}</style>' +
      '<section class="battlefield-map-section' + (battlefieldMapFullscreen ? ' is-fullscreen' : '') + '" data-battlefield-map-section>' +
      '<div class="battlefield-map-section__heading"><h2>Digital Battlefield Setup</h2>' +
      '<button type="button" data-toggle-battlefield-fullscreen aria-pressed="' + String(battlefieldMapFullscreen) + '">' +
      (battlefieldMapFullscreen ? 'Exit full screen' : 'Expand map') + '</button></div>' +
      '<p>Verified Event Companion terrain, deployment zones, and objective positions · Layout ' +
      escapeHtml(missionSetup.layout ?? 'not selected') +
      (selectedLayoutOption ? ' · source page ' + selectedLayoutOption.page : '') +
      '. The digital map uses the catalog geometry; the Event Companion remains the source of truth.</p>' +
      terrainReferenceMarkup + '</section>';
    const missionMapMarkup =
      '<section class="secondary-mission-setup"><h2>Secondary missions</h2>' +
      '<p>Set each player’s mode independently. Both players remain visible so you can configure both sides without switching a selector.</p>' +
      '<div class="secondary-player-panels">' + secondaryPlayerPanels + '</div>' +
      '<p>Card rules remain manual-review-only unless their scoring windows are verified from official card text. This screen records the physical cards; it does not award VP.</p></section>';
    const preFirstTurnSteps = getPreGameProcedureSteps().filter((step) =>
      !["confirm-mission", "confirm-armies", "terrain-objectives", "actual-deployment"].includes(step.id));
    const preFirstTurnMarkup = '<section class="pre-first-turn"><h2>Before the First Turn</h2><ol>' +
      preFirstTurnSteps.map((step) => '<li><strong>' + escapeHtml(step.title) + '</strong><p>' + escapeHtml(step.detail) + '</p></li>').join("") +
      '</ol>' + preGameRolesMarkup + '</section>';

    container.innerHTML = '<main class="battle-setup-screen"><header><div class="command-kicker">BATTLE SETUP</div>' +
      '<h1>Mission setup</h1><p>Choose the secondary mission mode before starting the battle. Complete pre-game checks, then confirm the mission and map.</p></header>' +
      '<section data-setup-content="pre-game"' + (activeSetupTab === "pre-game" ? '' : ' hidden') + '>' + preGameMarkup + missionMapMarkup + '</section>' +
      '<section data-setup-content="mission-map"' + (activeSetupTab === "mission-map" ? '' : ' hidden') + '>' + preFirstTurnMarkup + '</section>' +
      '<section data-setup-content="battlefield"' + (activeSetupTab === "battlefield" ? '' : ' hidden') + '>' + battlefieldMarkup + '</section>' +
      (message ? '<p role="status" class="battle-setup-screen__message">' + escapeHtml(message) + '</p>' : '') + '</main>';
  }

  container.addEventListener?.("change", handleChange);
  container.addEventListener?.("click", handleClick);
  container.addEventListener?.("pointerdown", handlePlanningPointerDown);
  container.addEventListener?.("pointermove", handlePlanningPointerMove);
  container.addEventListener?.("pointerup", handlePlanningPointerUp);
  container.addEventListener?.("pointercancel", handlePlanningPointerCancel);
  const unsubscribe = session.subscribe(render);
  render();
  loadEventCompanionEdgeMeasurements().then((measurements) => {
    if (screenDestroyed || !measurements || !Object.keys(measurements).length) return;
    edgeMeasurementsByPage = measurements;
    render();
  });
  return {
    render,
    setTab(tab) {
      if (tab === "pre-game" || tab === "mission-map" || tab === "battlefield") activeSetupTab = tab;
      render();
    },
    destroy() {
      screenDestroyed = true;
      unsubscribe();
      container.removeEventListener?.("change", handleChange);
      container.removeEventListener?.("click", handleClick);
      container.removeEventListener?.("pointerdown", handlePlanningPointerDown);
      container.removeEventListener?.("pointermove", handlePlanningPointerMove);
      container.removeEventListener?.("pointerup", handlePlanningPointerUp);
      container.removeEventListener?.("pointercancel", handlePlanningPointerCancel);
      container.replaceChildren();
    }
  };
}
