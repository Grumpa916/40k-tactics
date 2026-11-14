import { renderPhaseSelectedVitals } from './phase-selected-vitals.js';
import { renderTargetDefenseReminders, renderUnitRulesReminders, renderStratagemOpportunityReminders } from './rules-reminder-panel.js';
import { renderPhaseArmyRoster, bindPhaseArmySelection } from './phase-army-roster.js';
import { getLiveUnitVitals } from '../rules/live-unit-vitals.js';
import { captureViewContinuity } from './view-continuity.js';
import { renderActionReceipt } from './action-receipt.js';
import { isUnitBattleShocked } from '../rules/unit-status-summary.js';
import { getPrecisionAllocationOptions } from '../rules/precision-allocation.js';
import { renderCombatMapPanel } from './combat-workspace.js';
import { renderAdaptiveExecutionPanel } from './adaptive-execution-panel.js';
import { createMissionActionPicker } from "./mission-action-picker.js";
import { getSecondaryMissionIntelligence } from "../rules/secondary-mission-intelligence.js";
import { getLiveMissionActionOptions } from '../rules/mission-action-state.js';
import {
  getShootingViewModel,
  getShootingWeaponOptions,
  getShootingTargetOptions,
  activateShootingUnit,
  resolveShootingAttack,
  finishShootingPhase,
  finishShootingWithUnloggedResults,
  skipRemainingShootingUnits
} from "../application/shooting-workflow.js";
import { createShootingComparisonCache } from "../rules/tactical-shooting-comparison.js";
import { shootingTargetComparisonCards, shootingAdvisory, shootingDamageForecast } from './shooting-advisor-view.js';
import { createLiveMapView } from "./live-map-view.js";
import { bindLiveMapPositionCorrection } from "./live-map-position-correction.js";
import { finishCombatUnit } from "../application/combat-activation-workflow.js";
import { isCombatActivationFinished } from "../rules/combat-activation-state.js";
import { renderCustodesKatahPhasePanel, bindCustodesKatahActions } from "./custodes-katah-panel.js";
import { renderIncomingDamageForecast } from './incoming-damage-forecast-view.js';

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function ownerLabel(unit) {
  return unit?.side === "self" ? "You" : unit?.side === "opponent" ? "Opponent" : unit?.ownerName ?? "Unknown";
}

function actionLabel(activation) {
  if (activation.actionType === "not_shoot") return "Did not shoot";
  if (activation.actionType === "unlogged") return "Result not logged";
  if (activation.actionType === "mission_action") return `Action: ${activation.missionName ?? activation.actionId ?? "Mission Action"}`;
  if (activation.actionType === "special_action") return `Special Action: ${activation.actionId ?? "Special Action"}`;
  return "Shoot";
}

function unitButton(unit) {
  return `<button class="shoot-unit shoot-unit--${unit.side ?? "unknown"}" type="button" data-shoot-unit="${escapeHtml(unit.unitId)}">
    <strong>${escapeHtml(unit.name)}</strong><span>${escapeHtml(ownerLabel(unit))}</span><small>Tap to choose Shooting option</small>
  </button>`;
}

/* Keep identification visible beside the map controls when the Units drawer is
 * closed and the shooting details panel is scrolled. This does not select or move
 * anything; the label is derived from the current live phase selection. */
function renderShootingMapIdentity(state, shooterId, targetId = null) {
  const units = state?.units ?? [];
  const shooter = units.find(unit => unit.id === shooterId);
  const target = units.find(unit => unit.id === targetId);
  if (!shooter && !target) return '';
  const item = (caption, unit) => '<span class="shoot-tabletop__map-identity-item" title="' +
    escapeHtml(caption + ': ' + (unit.name ?? unit.id)) + '"><small>' +
    escapeHtml(caption) + '</small><strong>' + escapeHtml(unit.name ?? unit.id) + '</strong></span>';
  return '<div class="shoot-tabletop__map-identity" data-shoot-map-identity aria-label="Selected unit and target">' +
    (shooter ? item(target ? 'Shooter' : 'Selected unit', shooter) : '') +
    (target ? item('Target', target) : '') + '</div>';
}

function tabletopUnitSummary(state, unitId) {
  const unit = (Array.isArray(state?.units) ? state.units : []).find((item) => item?.id === unitId);
  if (!unit) return { unit: null, wounds: "—", models: "—", status: "" };
  const vitals = getLiveUnitVitals(state, unit);
  const wounds = vitals.wounds ?? '—';
  const models = vitals.models ?? '—';
  const status = isUnitBattleShocked(unit) ? 'Battle-shocked' : '';
  return { unit, wounds, models: String(models), status };
}

export function renderShootingHistoryRow(item, state, gameData) {
  const attacker = state.units.find((unit) => unit?.id === item.attackerId);
  const target = state.units.find((unit) => unit?.id === item.targetId);
  const allocation = item.allocationTargetId
    ? state.units.find((unit) => unit?.id === item.allocationTargetId)
    : null;
  const weapon = gameData?.weapons?.find((entry) => entry?.id === item.weaponId);
  // Event-time weapon names preserve the exact equipped profile even when a
  // saved-roster weapon ID is not present in the shared weapon catalog.
  const weaponLabel = item.weaponName || weapon?.name || item.weaponId || "Weapon";
  const expectedDamage = Number.isFinite(item.expectedDamage)
    ? item.expectedDamage.toFixed(1)
    : item.expectedDamage ?? item.totalDamage ?? 0;
  const result = item.targetStatusAfter === "destroyed"
    ? "Destroyed"
    : item.targetWoundsAfter == null ? `${item.actualDamage ?? item.totalDamage ?? 0} actual · ${expectedDamage} expected` : `${item.actualDamage ?? item.totalDamage ?? 0} actual · ${expectedDamage} expected · ${item.targetWoundsAfter} wounds`;
  const targetLabel = allocation
    ? `${target?.name ?? item.targetId} (${allocation.name ?? item.allocationTargetName ?? item.allocationTargetId})`
    : target?.name ?? item.targetId;
  return `<li><strong>${escapeHtml(attacker?.name ?? item.attackerId)} → ${escapeHtml(targetLabel)}</strong><span>${escapeHtml(weaponLabel)} · ${escapeHtml(result)}</span></li>`;
}

function renderSecondaryShootingIntelligence(state,playerId) {
  if(!playerId)return '';
  const plans=getSecondaryMissionIntelligence(state,{playerId})
    .filter(card=>card.verified&&card.eligibleNow&&card.action);
  if(!plans.length)return '';
  return `<details data-secondary-shooting-intelligence>
    <summary>Secondary Actions · ${plans.length} active</summary>
    ${plans.map(card=>`<p><strong>${escapeHtml(card.name)}</strong> · ${escapeHtml(card.action)}
      <small>${escapeHtml(card.advice)} Scoring is recorded manually at ${escapeHtml(card.timingLabels.join(' / ')||'the mission checkpoint')}.</small></p>`).join('')}
    <small>Use the printed Action rules on the tabletop. This reminder is not an Action recording control and does not consume an activation or award VP.</small>
  </details>`;
}

export function createShootingScreen(container, {
  session,
  perspectivePlayerId = null,
  gameData = null,
  missionActions = [],
  layoutMode = "tabletop",
  unitSelection = null
} = {}) {
  if (!container || typeof container.replaceChildren !== "function") throw new TypeError("A browser container element is required.");
  if (!session || typeof session.getState !== "function" || typeof session.subscribe !== "function") throw new TypeError("A game session is required.");

  const mapView = createLiveMapView();
  const compareTargets = createShootingComparisonCache();
  const missionActionPicker = createMissionActionPicker({ mapPerspectivePlayerId: perspectivePlayerId });
  let pendingUnitId = null;
  let selectedAttackerId = null;
  let selectedWeaponId = null;
  let selectedTargetId = null;
  let precisionAllocationId = null;
  let actualDamage = "0";
  let attackError = "";
  let actionPickerOpen = false;
  let endReview = false;
  let lastRenderedActiveUnitId = null;
  let restoreInheritedUnit = Boolean(unitSelection);

  function clearPending() {
    pendingUnitId = null;
  }

  function tryActivate(payload) {
    try {
      activateShootingUnit(session, payload);
      return true;
    } catch (error) {
      attackError = error?.message ?? String(error);
      render();
      return false;
    }
  }

  function beginShoot(unitId) {
    if (!unitId) return false;
    const previousPendingUnitId = pendingUnitId;
    unitSelection?.select(session.getState(), unitId);
    const previewWeaponId = selectedWeaponId;
    const previewTargetId = selectedTargetId;
    selectedAttackerId = unitId;
    precisionAllocationId = null;
    pendingUnitId = null;
    actualDamage = "0";
    attackError = "";
    actionPickerOpen = false;
    try {
      activateShootingUnit(session, { unitId, actionType: "shoot" });
    } catch (error) {
      selectedAttackerId = null;
      selectedWeaponId = previewWeaponId;
      selectedTargetId = previewTargetId;
      precisionAllocationId = null;
      pendingUnitId = previousPendingUnitId ?? unitId;
      attackError = error?.message ?? String(error);
      render();
      return false;
    }
    const availableWeapons = getShootingWeaponOptions(session.getState(), { attackerId: unitId, gameData });
    selectedWeaponId = availableWeapons.some(weapon => weapon.id === previewWeaponId)
      ? previewWeaponId : availableWeapons.length === 1 ? availableWeapons[0].id : null;
    render();
    return true;
  }

  function render() {
    const restoreView = captureViewContinuity(container);
    const state = session.getState();
    const model = getShootingViewModel(state, { perspectivePlayerId });
    const viewingPlayerId = perspectivePlayerId ?? state.players?.[0]?.id ?? state.activePlayer;
    const incomingAttackMode = state.phase === 'shooting' && model.activePlayerId !== viewingPlayerId;
    const phaseNotice = state.phase !== "shooting"
      ? `<p class="shoot-error" role="status">Viewing Shooting. The game is still in ${escapeHtml(state.phase)}. Use Return to current phase, then the phase advance button to reach Shooting.</p>`
      : "";
    const configuredPrimaryActions = missionActions.filter((action) =>
      action?.missionKind === 'primary' || String(action?.definitionId ?? '').startsWith('primary-'));
    const livePrimaryActions = getLiveMissionActionOptions(state, model.activePlayerId);
    const availableMissionActions = livePrimaryActions.length ? livePrimaryActions : configuredPrimaryActions;
    const hasPrimaryMissionAction = availableMissionActions.length > 0;
    const actionOnly = hasPrimaryMissionAction ? (model.actionOnly ?? []) : [];
    const readyUnits = [...model.candidates, ...actionOnly];
    const openUnits = model.activations.filter(item => item.actionType === 'shoot' && !isCombatActivationFinished(state, item.unitId, 'shooting'));

    // Restoring a prior phase's selection only opens the preview. It never
    // dispatches a Shoot action or silently chooses shooting over an Action.
    if (restoreInheritedUnit) {
      restoreInheritedUnit = false;
      const inheritedId = unitSelection?.get(state, {
        eligibleIds: [...readyUnits, ...openUnits].map(item => item.unitId)
      });
      if (inheritedId) {
        if (openUnits.some(item => item.unitId === inheritedId)) selectedAttackerId = inheritedId;
        else pendingUnitId = inheritedId;
      }
    }

    if (selectedAttackerId && (isCombatActivationFinished(state, selectedAttackerId, "shooting") || !model.activations.some((activation) =>
      activation.unitId === selectedAttackerId && activation.actionType === "shoot"
    ))) {
      selectedAttackerId = null;
      selectedWeaponId = null;
      selectedTargetId = null;
      precisionAllocationId = null;
    }

    const pendingUnit = readyUnits.find((unit) => unit.unitId === pendingUnitId);
    const preview = layoutMode === "tabletop" && Boolean(pendingUnit);
    const attackerId = selectedAttackerId ?? (preview ? pendingUnit.unitId : null);
    const weapons = getShootingWeaponOptions(state, { attackerId, gameData, preview });
    if (!weapons.some((weapon) => weapon.id === selectedWeaponId)) {
      selectedWeaponId = preview && weapons.length === 1 ? weapons[0].id : null;
    }
    const selectedWeapon = weapons.find((weapon) => weapon.id === selectedWeaponId) ?? null;
    const targets = getShootingTargetOptions(state, { attackerId, perspectivePlayerId, preview, weapon: selectedWeapon });
    const selectableIds = new Set(state.phase === 'shooting'
      ? [...readyUnits, ...targets, ...openUnits].map(item => item.unitId)
      : []);
    if (!targets.some((target) => target.unitId === selectedTargetId)) selectedTargetId = null;
    const precisionOptions = selectedWeapon?.characteristics?.precision === true && selectedTargetId
      ? getPrecisionAllocationOptions(state, selectedTargetId)
      : [];
    if (!precisionOptions.some((option) => option.unitId === precisionAllocationId)) precisionAllocationId = null;

    if (layoutMode === "tabletop") {
      const activeUnitId = selectedAttackerId ?? pendingUnit?.unitId;
      const activeSummary = tabletopUnitSummary(state, activeUnitId);
      const activeUnit = activeSummary.unit;
      const activeActivation = selectedAttackerId
        ? model.activations.find((activation) => activation.unitId === selectedAttackerId && activation.actionType === "shoot")
        : null;
      const reminderUnitId = incomingAttackMode ? (activeActivation ? selectedTargetId : null) : activeUnitId;
      const remaining = model.candidates.length + openUnits.length;
      const actingIds = new Set(openUnits.map(item => item.unitId));
      const sections = state.phase === 'shooting' ? [
        { label: 'Acting', unitIds: actingIds },
        { label: 'Ready', unitIds: new Set(readyUnits.map(item => item.unitId)) },
        { label: 'Finished', unitIds: new Set(model.activations.map(item => item.unitId).filter(id => !actingIds.has(id))) }
      ] : [];
      const comparison = !incomingAttackMode && attackerId && selectedWeapon
        ? compareTargets(state, { playerId: activeUnit.ownerId, attackerId, weapon: selectedWeapon }) : null;
      const targetComparison = incomingAttackMode
        ? renderIncomingDamageForecast(state, { attackerId, targetId: selectedTargetId, weapon: selectedWeapon })
        : shootingTargetComparisonCards(attackerId, selectedWeaponId, selectedTargetId, state, weapons, perspectivePlayerId, comparison);
      container.innerHTML = `<link rel="stylesheet" href="${new URL('./styles/shooting-panel.css', import.meta.url).href}"><main class="shoot-screen shoot-screen--tabletop has-army-roster${selectedTargetId ? ' is-target-selected' : ''}">
        <aside class="combat-workspace__rail" id="live-units" aria-label="Shooting units and targets">
          ${renderPhaseArmyRoster(state, perspectivePlayerId, { selectedUnitId:activeUnitId, selectableIds, targetIds:[selectedTargetId], sections, enableAdjust:state.phase === 'shooting' })}
        </aside>
        ${renderCombatMapPanel({ state, phase: 'shooting', mapView,
          perspectivePlayerId: perspectivePlayerId ?? model.activePlayerId,
          selectedUnitId: activeUnitId,
          mapExtra: renderShootingMapIdentity(state, activeUnitId, selectedTargetId) })}

        <section class="shoot-tabletop__control-panel">
          <div class="shoot-tabletop__control-scroll">
            ${state.phase === 'shooting' ? renderStratagemOpportunityReminders(state, {perspectivePlayerId,selectedUnitId:reminderUnitId,livePanel:true}) : ''}
            ${state.phase === 'shooting' ? renderAdaptiveExecutionPanel(state, {selectedUnitId:activeUnitId, playerId:perspectivePlayerId ?? state.activePlayer, targetId:selectedTargetId}) : ''}
            <header class="shoot-tabletop__phase-heading"><div><span class="kicker">SHOOTING · ACTIVE ARMY</span><h1>${escapeHtml(activeUnit?.name ?? "Select a unit")}</h1><p>${escapeHtml(activeUnit ? ownerLabel({ side: activeUnit.ownerId === perspectivePlayerId ? "self" : "opponent", ownerName: activeUnit.ownerId }) : "Tap an acting unit on the map or open Units")}</p></div><span>${remaining === 0 ? "Ready to advance" : "Round " + escapeHtml(model.round)}</span></header>
            ${activeUnit && state.phase === "shooting" ? `<div class="shoot-tabletop__unit-status">${renderPhaseSelectedVitals(state, activeUnitId)}</div>` : ""}
            ${renderCustodesKatahPhasePanel(state, { phase: "shooting", unitId: activeUnitId, playerId: viewingPlayerId })}

            ${activeActivation ? renderTargetDefenseReminders(state, {targetUnitId:selectedTargetId,allocationTargetId:precisionAllocationId,attackerId:selectedAttackerId,weapon:selectedWeapon,phase:'shooting',viewingPlayerId}) : ''}
            ${state.phase === 'shooting' ? renderUnitRulesReminders(state, {perspectivePlayerId,selectedUnitId:reminderUnitId,includeStratagems:false,livePanel:true}) : ''}
            ${phaseNotice}
            ${!incomingAttackMode && state.phase === 'shooting' ? renderSecondaryShootingIntelligence(state,model.activePlayerId) : ''}
            ${attackError ? `<p class="shoot-error" role="alert">${escapeHtml(attackError)}</p>` : ""}
            ${pendingUnit ? `<div class="shoot-tabletop__action-choice">
              <button type="button" data-choice-shoot ${actionOnly.some((unit) => unit.unitId === pendingUnitId) ? "disabled" : ""}>Shoot</button>
              ${hasPrimaryMissionAction ? `<button type="button" data-choice-action-toggle aria-pressed="${String(actionPickerOpen)}">Primary Action</button>` : ''}
              <button type="button" data-choice-not-shoot>Do not shoot</button>
            </div>
            ${actionPickerOpen ? missionActionPicker.render(state, pendingUnitId, availableMissionActions) : ""}` : ""}

            ${attackerId && (activeActivation || targets.length) ? `<div class="shoot-tabletop__attack-controls">
              ${preview ? '<small>Preview · choose Shoot to start recording.</small>' : ''}
              <label>Ranged weapon<select data-weapon><option value="" ${selectedWeaponId ? "" : "selected"}>Choose weapon…</option>${weapons.map((weapon) => `<option value="${escapeHtml(weapon.id)}" ${weapon.id === selectedWeaponId ? "selected" : ""}>${escapeHtml(weapon.name)}</option>`).join("")}</select></label>
              <label>Target · tap an enemy marker or choose below<select data-target><option value="" ${selectedTargetId ? "" : "selected"}>Choose target…</option>${targets.map((target) => `<option value="${escapeHtml(target.unitId)}" ${target.unitId === selectedTargetId ? "selected" : ""}>${escapeHtml(target.name)}</option>`).join("")}</select></label>
              ${activeActivation && precisionOptions.length ? `<label>Precision allocation · optional<select data-shoot-precision><option value="">Normal allocation</option>${precisionOptions.map((option) => `<option value="${escapeHtml(option.unitId)}" ${option.unitId === precisionAllocationId ? "selected" : ""}>${escapeHtml(option.name)}</option>`).join("")}</select><small>Choose an attached Leader only if you allocated this Precision weapon’s wounds to that Character on the tabletop.</small></label>` : ""}

            </div>` : ""}

            <section class="shoot-tabletop__advisor" aria-label="${incomingAttackMode ? 'Incoming damage estimate' : 'Tactical Advisor'}">
              <div class="shoot-tabletop__advisor-heading"><div><span class="kicker">${incomingAttackMode ? 'DEFENSIVE REVIEW' : 'TACTICAL ADVISOR'}</span><h2>${incomingAttackMode ? 'Incoming attack' : 'Compare your targets'}</h2></div><span>${selectedTargetId ? "Selected target" : "Choose target"}</span></div>
              <div class="shoot-tabletop__target-comparisons">${targetComparison}</div>
              ${!incomingAttackMode && attackerId && selectedWeaponId && selectedTargetId ? `<details class="shoot-tabletop__selected-target" data-view-key="shoot-selected-target" open><summary>Selected target details</summary><div class="shoot-tabletop__advisor-scroll">
                ${shootingAdvisory(attackerId, selectedWeaponId, selectedTargetId, state, weapons, perspectivePlayerId, { openDetails: false, comparison })}
              </div></details>` : ''}
            </section>

            <details class="shoot-tabletop__history" data-view-key="shoot-history"><summary>Phase history · ${model.attacks.length} attacks</summary>
              <ol class="history">${model.attacks.length ? model.attacks.map((item) => renderShootingHistoryRow(item, state, gameData)).join("") : "<li>No attacks recorded yet.</li>"}</ol>
            </details>
          </div>
          <footer class="shoot-tabletop__footer">${renderActionReceipt(session, { compact:true })}${state.phase !== 'shooting' ? '' : activeActivation ? `<div class="damage-control shoot-tabletop__damage"><span class="damage-control__label">Actual damage</span><div class="damage-control__buttons"><button type="button" data-shoot-damage-minus aria-label="Decrease actual damage">−</button><strong data-shoot-damage-value>${escapeHtml(actualDamage)}</strong><button type="button" data-shoot-damage-plus aria-label="Increase actual damage">+</button></div></div>
              <button class="shoot-tabletop__record" type="button" data-attack ${selectedWeaponId && selectedTargetId ? "" : "disabled"}>Record shooting attack →</button>
              <button class="shoot-tabletop__finish" type="button" data-finish-unit>Finish unit</button>` : remaining === 0 ? '<button class="complete" type="button" data-complete>End Shooting · Charge →</button>' : endReview ? `
              <section class="combat-end-review shoot-tabletop__end-review" aria-label="End Shooting review">
                <strong>End Shooting?</strong>
                ${model.candidates.length ? `<p>Mark ${model.candidates.length} remaining ${model.candidates.length === 1 ? 'unit' : 'units'} as result not logged.</p>` : ''}
                ${openUnits.length ? `<p>Close ${openUnits.length} open ${openUnits.length === 1 ? 'activation' : 'activations'} with the attacks recorded so far.</p>` : ''}
                <button type="button" data-confirm-end-shooting>End Shooting</button>
                <button type="button" data-cancel-end-shooting>Keep playing</button>
              </section>` : `<button class="shoot-tabletop__review" type="button" data-review-end-shooting>End Shooting · Review ${remaining} ${remaining === 1 ? 'unit' : 'units'}</button>`}</footer>
        </section>
      </main>`;
    } else {
      container.innerHTML = `<main class="shoot-screen">
      <header><div><div class="kicker">LIVE BATTLE</div><h1>Shooting Phase</h1><p>Round ${escapeHtml(model.round)} · Turn ${escapeHtml(model.turn)}</p></div>
      <strong>${model.canComplete ? "All Shooting choices recorded" : "Resolve the next eligible unit"}</strong></header>
      ${phaseNotice}
      ${attackError ? `<p class="shoot-error" role="alert">${escapeHtml(attackError)}</p>` : ""}
      <p class="note">Record shooting choices only. Secondary mission completion is decided manually at the scoring checkpoint. A Primary Action appears here only when the active Primary mission requires one.</p>

      <section>
        <div class="heading"><h2>Eligible units</h2><span>${model.candidates.length} remaining</span></div>
        <div class="candidates">${model.candidates.length ? model.candidates.map(unitButton).join("") : "<p>None</p>"}</div>
        ${actionOnly.length ? `<div class="heading"><h3>No ranged weapons · optional Primary Action</h3></div><p>These units do not need a Shooting choice to finish this phase. Select one only if recording the active Primary mission Action.</p><div class="candidates">${actionOnly.map(unitButton).join("")}</div>` : ""}
        ${pendingUnit ? `<div class="choice">
          <div><strong>${escapeHtml(pendingUnit.name)}</strong><span>${escapeHtml(ownerLabel(pendingUnit))} — choose this unit's Shooting-phase choice</span></div>
          <div class="choice-buttons">
            <button type="button" data-choice-shoot ${actionOnly.some(unit => unit.unitId === pendingUnitId) ? "disabled" : ""}>Shoot</button>
            ${hasPrimaryMissionAction ? `<button type="button" data-choice-action-toggle aria-pressed="${String(actionPickerOpen)}">Primary Action</button>` : ''}
            <button type="button" data-choice-not-shoot>Do not shoot</button>
            <button type="button" data-choice-cancel>Cancel</button>
          </div>
          ${actionPickerOpen ? missionActionPicker.render(state, pendingUnitId, availableMissionActions) : ""}
        </div>` : ""}
      </section>

      <div class="grid">
        <section><div class="heading"><h2>Ranged attack</h2><span>Only units that chose Shoot</span></div>
          <div class="controls">
            <div class="shoot-selected-shooter"><strong>${selectedAttackerId ? escapeHtml(model.activations.find((unit) => unit.unitId === selectedAttackerId)?.unit.name ?? selectedAttackerId) : "No shooter selected"}</strong><span>Selected shooter</span></div>
            <label>Weapon<select data-weapon ${selectedAttackerId ? "" : "disabled"}><option value="" ${selectedWeaponId ? "" : "selected"}>Select ranged weapon</option>${weapons.map((weapon) => `<option value="${escapeHtml(weapon.id)}" ${weapon.id === selectedWeaponId ? "selected" : ""}>${escapeHtml(weapon.name)}</option>`).join("")}</select></label>
            <label>Target<select data-target ${selectedAttackerId ? "" : "disabled"}><option value="" ${selectedTargetId ? "" : "selected"}>Select enemy target</option>${targets.map((target) => `<option value="${escapeHtml(target.unitId)}" ${target.unitId === selectedTargetId ? "selected" : ""}>${escapeHtml(target.name)} · ${escapeHtml(ownerLabel(target))}</option>`).join("")}</select></label>
            ${precisionOptions.length ? `<label>Precision allocation · optional<select data-shoot-precision><option value="">Normal allocation</option>${precisionOptions.map((option) => `<option value="${escapeHtml(option.unitId)}" ${option.unitId === precisionAllocationId ? "selected" : ""}>${escapeHtml(option.name)}</option>`).join("")}</select><small>Choose an attached Leader only if you allocated this Precision weapon’s wounds to that Character on the tabletop.</small></label>` : ""}
            <div class="damage-control">
              <span class="damage-control__label">Actual damage</span>
              <div class="damage-control__buttons">
                <button type="button" data-shoot-damage-minus aria-label="Decrease actual damage">−</button>
                <strong data-shoot-damage-value">${escapeHtml(actualDamage)}</strong>
                <button type="button" data-shoot-damage-plus aria-label="Increase actual damage">+</button>
              </div>
              <small>Expected damage is calculated automatically and retained in the attack result.</small>
            </div>
            <button type="button" data-attack ${selectedAttackerId ? "" : "disabled"}>Record Attack</button>
            ${attackError ? `<p class="shoot-error" role="alert">${escapeHtml(attackError)}</p>` : ""}
            ${selectedAttackerId && selectedWeaponId && selectedTargetId ? shootingDamageForecast(selectedAttackerId, selectedWeaponId, selectedTargetId, state, weapons) : ""}
            ${selectedAttackerId && selectedWeaponId && selectedTargetId ? shootingAdvisory(selectedAttackerId, selectedWeaponId, selectedTargetId, state, weapons, perspectivePlayerId) : ""}
          </div>
        </section>

        <section><div class="heading"><h2>Shooting history</h2><span>${model.activations.length} resolved</span></div>
          <ol class="history">${model.activations.length ? model.activations.map((item,index) => `<li><strong>${index+1}. ${escapeHtml(item.unit.name)}</strong><span>${escapeHtml(actionLabel(item))}</span></li>`).join("") : "<li>No units selected yet.</li>"}</ol>
        </section>

        <section><div class="heading"><h2>Attack results</h2><span>${model.attacks.length} recorded</span></div>
          <ol class="history">${model.attacks.length ? model.attacks.map((item) => historyRow(item,state,gameData)).join("") : "<li>No attacks recorded yet.</li>"}</ol>
        </section>
      </div>
      <footer>${model.canComplete ? `<button class="complete" type="button" data-complete>End Shooting Phase</button>` : `<button class="complete" type="button" data-skip-shooting>Skip remaining &amp; end Shooting</button>`}</footer>
    </main>`;
    }

    restoreView();
    const renderedActiveUnitId = selectedAttackerId ?? pendingUnitId ?? null;
    if (renderedActiveUnitId !== lastRenderedActiveUnitId) {
      const controls = container.querySelector?.('.shoot-tabletop__control-scroll');
      if (controls) controls.scrollTop = 0;
      lastRenderedActiveUnitId = renderedActiveUnitId;
    }
    if (layoutMode === "tabletop" && selectedTargetId) {
      container.querySelectorAll?.("[data-map-unit-id]").forEach((marker) => {
        if (marker.getAttribute?.("data-map-unit-id") === selectedTargetId) {
          marker.classList?.add?.("is-targeted");
          marker.setAttribute?.("aria-pressed", "true");
          if (marker.style) {
            marker.style.outline = "3px solid #ffd36a";
            marker.style.outlineOffset = "2px";
          }
        }
      });
    }

    container.querySelectorAll("[data-shoot-unit]").forEach((button) => button.addEventListener("click", () => {
      pendingUnitId = button.getAttribute("data-shoot-unit");
      unitSelection?.select(session.getState(), pendingUnitId);
      selectedAttackerId = null;
      selectedWeaponId = null;
      selectedTargetId = null;
      precisionAllocationId = null;
      actionPickerOpen = false;
      render();
    }));

    if (layoutMode === "tabletop") {
      const selectMapUnit = (unitId) => {
        if (!unitId || state.phase !== "shooting") return;
        endReview = false;
        if (targets.some((target) => target.unitId === unitId)) {
          if (selectedTargetId === unitId) return;
          selectedTargetId = unitId;
          precisionAllocationId = null;
          actualDamage = "0";
          attackError = "";
          render();
          return;
        }
        if (unitId === pendingUnitId || unitId === selectedAttackerId) return;
        if (readyUnits.some((unit) => unit.unitId === unitId)) {
          unitSelection?.select(state, unitId);
          pendingUnitId = unitId;
          selectedAttackerId = null;
          selectedWeaponId = null;
          selectedTargetId = null;
          precisionAllocationId = null;
          actualDamage = "0";
          attackError = "";
          actionPickerOpen = false;
          render();
          return;
        }
        if (openUnits.some(activation => activation.unitId === unitId)) {
          unitSelection?.select(state, unitId);
          selectedAttackerId = unitId;
          pendingUnitId = null;
          const availableWeapons = getShootingWeaponOptions(state, { attackerId: unitId, gameData });
          selectedWeaponId = availableWeapons.length === 1 ? availableWeapons[0].id : null;
          selectedTargetId = null;
          precisionAllocationId = null;
          actualDamage = "0";
          attackError = "";
          actionPickerOpen = false;
          render();
        }
      };
      mapView.bind(container, undefined, undefined, session);
      bindPhaseArmySelection(container, selectMapUnit);
      bindCustodesKatahActions(container, session, message => { attackError = message; }, render);

      container.querySelectorAll?.("[data-map-unit-id]").forEach((marker) => {
        const unitId = marker.getAttribute?.("data-map-unit-id");
        const isTarget = targets.some((target) => target.unitId === unitId);
        marker.setAttribute?.("role", "button");
        marker.setAttribute?.("tabindex", "0");
        marker.setAttribute?.("aria-pressed", String(unitId === selectedTargetId || unitId === renderedActiveUnitId));
        if (selectableIds.has(unitId)) marker.setAttribute?.('data-phase-map-select', 'true');
        if (isTarget) marker.setAttribute?.("data-shoot-target-marker", "true");
        if (marker.style) marker.style.touchAction = "none";
        marker.addEventListener?.("click", () => selectMapUnit(unitId));
        marker.addEventListener?.("keydown", (event) => {
          if (event?.key === "Enter" || event?.key === " ") {
            event.preventDefault?.();
            selectMapUnit(unitId);
          }
        });
      });
      container.querySelectorAll?.("[data-advisor-target]").forEach((button) => button.addEventListener?.("click", () => {
        selectMapUnit(button.getAttribute?.("data-advisor-target"));
      }));
      container.querySelector?.("[data-finish-unit]")?.addEventListener?.("click", () => {
        try { finishCombatUnit(session, selectedAttackerId); }
        catch (cause) { attackError = cause?.message ?? String(cause); render(); return; }
        selectedAttackerId = null;
        selectedWeaponId = null;
        selectedTargetId = null;
        precisionAllocationId = null;
        actualDamage = "0";
        attackError = "";
        actionPickerOpen = false;
        render();
      });
    }

    container.querySelector?.("[data-choice-action-toggle]")?.addEventListener?.("click", () => {
      actionPickerOpen = !actionPickerOpen;
      attackError = "";
      render();
    });

    container.querySelector("[data-choice-shoot]")?.addEventListener("click", () => {
      if (!pendingUnitId) return;
      beginShoot(pendingUnitId);
    });

    container.querySelector("[data-choice-not-shoot]")?.addEventListener("click", () => {
      if (!pendingUnitId) return;
      if (!tryActivate({ unitId: pendingUnitId, actionType: "not_shoot" })) return;
      selectedAttackerId = null;
      selectedWeaponId = null;
      selectedTargetId = null;
      precisionAllocationId = null;
      attackError = "";
      actionPickerOpen = false;
      clearPending();
      render();
    });

    if (actionPickerOpen) {
      missionActionPicker.bind(container, payload => {
        if (!pendingUnitId || !tryActivate({unitId:pendingUnitId,actionType:"mission_action",...payload})) return;
        actionPickerOpen=false; clearPending(); render();
      }, render);
    }

    container.querySelector("[data-choice-cancel]")?.addEventListener("click", () => {
      actionPickerOpen = false;
      clearPending();
      render();
    });

    function deferRenderAfterSelectDismissal(select) {
      select?.blur?.();
      const nextFrame = globalThis.requestAnimationFrame ?? (callback => globalThis.setTimeout(callback, 0));
      nextFrame(() => nextFrame(render));
    }

    container.querySelectorAll("[data-weapon]").forEach(select => select.addEventListener("change", event => {
      const select = event.currentTarget ?? event.target;
      selectedWeaponId = select.value || null;
      precisionAllocationId = null;
      actualDamage = "0";
      attackError = "";
      deferRenderAfterSelectDismissal(select);
    }));
    container.querySelectorAll("[data-target]").forEach(select => select.addEventListener("change", event => {
      const select = event.currentTarget ?? event.target;
      selectedTargetId = select.value || null;
      precisionAllocationId = null;
      actualDamage = "0";
      attackError = "";
      deferRenderAfterSelectDismissal(select);
    }));
    container.querySelectorAll("[data-shoot-precision]").forEach(select => select.addEventListener("change", event => {
      const select = event.currentTarget ?? event.target;
      precisionAllocationId = select.value || null;
      actualDamage = "0";
      attackError = "";
      deferRenderAfterSelectDismissal(select);
    }));
    container.querySelector("[data-shoot-damage-minus]")?.addEventListener("click", () => {
      actualDamage = String(Math.max(0, Number(actualDamage) - 1));
      const value = container.querySelector("[data-shoot-damage-value]");
      if (value) value.textContent = actualDamage;
    });
    container.querySelector("[data-shoot-damage-plus]")?.addEventListener("click", () => {
      actualDamage = String(Number(actualDamage) + 1);
      const value = container.querySelector("[data-shoot-damage-value]");
      if (value) value.textContent = actualDamage;
    });
    container.querySelector("[data-attack]")?.addEventListener("click", () => {
      const weaponId = container.querySelector("[data-weapon]")?.value || selectedWeaponId;
      const targetId = container.querySelector("[data-target]")?.value || selectedTargetId;
      const weapon = weapons.find((item) => item.id === weaponId);
      if (!selectedAttackerId || !weaponId || !weapon || !targetId) {
        attackError = "Select a shooter, ranged weapon, and target before recording the attack.";
        render();
        return;
      }
      const damage = Number(actualDamage);
      if (!Number.isInteger(damage) || damage < 0) {
        attackError = "Actual damage must be zero or a positive whole number.";
        render();
        return;
      }
      try {
        resolveShootingAttack(session, { attackerId: selectedAttackerId, targetId, allocationTargetId: precisionAllocationId, weapon, actualDamage: damage });
        selectedWeaponId = weaponId;
        if (layoutMode !== "tabletop") selectedTargetId = null;
        precisionAllocationId = null;
        actualDamage = "0";
        attackError = "";
      } catch (error) {
        attackError = error?.message ?? String(error);
      }
      render();
    });
    container.querySelector("[data-skip-shooting]")?.addEventListener("click", () => {
      try { skipRemainingShootingUnits(session); }
      catch (error) { attackError = error?.message ?? String(error); render(); }
    });
    container.querySelector("[data-review-end-shooting]")?.addEventListener("click", () => {
      endReview = true;
      render();
      container.querySelector("[data-cancel-end-shooting]")?.focus?.();
    });
    container.querySelector("[data-cancel-end-shooting]")?.addEventListener("click", () => {
      endReview = false;
      render();
      container.querySelector("[data-review-end-shooting]")?.focus?.();
    });
    container.querySelector("[data-confirm-end-shooting]")?.addEventListener("click", () => {
      try { finishShootingWithUnloggedResults(session); }
      catch (error) { attackError = error?.message ?? String(error); render(); }
    });
    container.querySelector("[data-complete]")?.addEventListener("click", () => {
      try { finishShootingPhase(session); }
      catch (error) { attackError = error?.message ?? String(error); render(); }
    });

    return model;
  }

  const unbindMapCorrection = layoutMode === "tabletop"
    ? bindLiveMapPositionCorrection(container, session, { phase:"shooting", onError:message => { attackError = message; render(); } })
    : () => {};
  const unsubscribe = session.subscribe(render);
  render();
  return {
    getState: () => session.getState(),
    render,
    destroy: () => { unsubscribe(); unbindMapCorrection(); container.replaceChildren(); }
  };
}
