import { renderPhaseArmyRoster } from './phase-army-roster.js';
import { getLiveUnitVitals } from '../rules/live-unit-vitals.js';
import { captureViewContinuity } from './view-continuity.js';
import { renderActionReceipt } from './action-receipt.js';
import { isUnitBattleShocked } from '../rules/unit-status-summary.js';
import { getPrecisionAllocationOptions } from '../rules/precision-allocation.js';
import { renderCombatMapPanel } from './combat-workspace.js';
import { createMissionActionPicker } from "./mission-action-picker.js";
import {
  getShootingViewModel,
  getShootingWeaponOptions,
  getShootingTargetOptions,
  activateShootingUnit,
  resolveShootingAttack,
  finishShootingPhase
} from "../application/shooting-workflow.js";
import { createShootingComparisonCache } from "../rules/tactical-shooting-comparison.js";
import { shootingTargetComparisonCards, shootingAdvisory, shootingDamageForecast } from './shooting-advisor-view.js';
import { createLiveMapView } from "./live-map-view.js";
import { finishCombatUnit } from "../application/combat-activation-workflow.js";
import { isCombatActivationFinished } from "../rules/combat-activation-state.js";

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
  if (activation.actionType === "mission_action") return `Action: ${activation.missionName ?? activation.actionId ?? "Mission Action"}`;
  if (activation.actionType === "special_action") return `Special Action: ${activation.actionId ?? "Special Action"}`;
  return "Shoot";
}

function unitButton(unit) {
  return `<button class="shoot-unit shoot-unit--${unit.side ?? "unknown"}" type="button" data-shoot-unit="${escapeHtml(unit.unitId)}">
    <strong>${escapeHtml(unit.name)}</strong><span>${escapeHtml(ownerLabel(unit))}</span><small>Tap to choose Shoot or Action</small>
  </button>`;
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

function historyRow(item, state, gameData) {
  const attacker = state.units.find((unit) => unit?.id === item.attackerId);
  const target = state.units.find((unit) => unit?.id === item.targetId);
  const allocation = item.allocationTargetId
    ? state.units.find((unit) => unit?.id === item.allocationTargetId)
    : null;
  const weapon = gameData?.weapons?.find((entry) => entry?.id === item.weaponId);
  const expectedDamage = Number.isFinite(item.expectedDamage)
    ? item.expectedDamage.toFixed(1)
    : item.expectedDamage ?? item.totalDamage ?? 0;
  const result = item.targetStatusAfter === "destroyed"
    ? "Destroyed"
    : item.targetWoundsAfter == null ? `${item.actualDamage ?? item.totalDamage ?? 0} actual · ${expectedDamage} expected` : `${item.actualDamage ?? item.totalDamage ?? 0} actual · ${expectedDamage} expected · ${item.targetWoundsAfter} wounds`;
  const targetLabel = allocation
    ? `${target?.name ?? item.targetId} (${allocation.name ?? item.allocationTargetName ?? item.allocationTargetId})`
    : target?.name ?? item.targetId;
  return `<li><strong>${escapeHtml(attacker?.name ?? item.attackerId)} → ${escapeHtml(targetLabel)}</strong><span>${escapeHtml(weapon?.name ?? item.weaponId ?? "Weapon")} · ${escapeHtml(result)}</span></li>`;
}

export function createShootingScreen(container, {
  session,
  perspectivePlayerId = null,
  gameData = null,
  missionActions = [],
  layoutMode = "tabletop"
} = {}) {
  if (!container || typeof container.replaceChildren !== "function") throw new TypeError("A browser container element is required.");
  if (!session || typeof session.getState !== "function" || typeof session.subscribe !== "function") throw new TypeError("A game session is required.");

  const mapView = createLiveMapView();
  const compareTargets = createShootingComparisonCache();
  const missionActionPicker = createMissionActionPicker();
  let pendingUnitId = null;
  let selectedAttackerId = null;
  let selectedWeaponId = null;
  let selectedTargetId = null;
  let precisionAllocationId = null;
  let actualDamage = "0";
  let attackError = "";
  let actionPickerOpen = false;
  let lastRenderedSelection = null;

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

  function beginShoot(unitId, { targetId = null } = {}) {
    if (!unitId) return false;
    const previousPendingUnitId = pendingUnitId;
    selectedAttackerId = unitId;
    selectedWeaponId = null;
    selectedTargetId = targetId;
    precisionAllocationId = null;
    pendingUnitId = null;
    actualDamage = "0";
    attackError = "";
    actionPickerOpen = false;
    try {
      activateShootingUnit(session, { unitId, actionType: "shoot" });
    } catch (error) {
      selectedAttackerId = null;
      selectedWeaponId = null;
      selectedTargetId = null;
      precisionAllocationId = null;
      pendingUnitId = previousPendingUnitId ?? unitId;
      attackError = error?.message ?? String(error);
      render();
      return false;
    }
    const availableWeapons = getShootingWeaponOptions(session.getState(), { attackerId: unitId, gameData });
    selectedWeaponId = availableWeapons.length === 1 ? availableWeapons[0].id : null;
    render();
    return true;
  }

  function render() {
    const restoreView = captureViewContinuity(container);
    const state = session.getState();
    const model = getShootingViewModel(state, { perspectivePlayerId });
    const phaseNotice = state.phase !== "shooting"
      ? `<p class="shoot-error" role="status">Viewing Shooting. The game is still in ${escapeHtml(state.phase)}. Use Return to current phase, then the phase advance button to reach Shooting.</p>`
      : "";
    const actionOnly = model.actionOnly ?? [];

    if (selectedAttackerId && (isCombatActivationFinished(state, selectedAttackerId, "shooting") || !model.activations.some((activation) =>
      activation.unitId === selectedAttackerId && activation.actionType === "shoot"
    ))) {
      selectedAttackerId = null;
      selectedWeaponId = null;
      selectedTargetId = null;
      precisionAllocationId = null;
    }

    const weapons = getShootingWeaponOptions(state, { attackerId: selectedAttackerId, gameData });
    const targets = getShootingTargetOptions(state, { attackerId: selectedAttackerId, perspectivePlayerId });
    const pendingUnit = [...model.candidates, ...actionOnly].find((unit) => unit.unitId === pendingUnitId);
    if (!weapons.some((weapon) => weapon.id === selectedWeaponId)) selectedWeaponId = null;
    if (!targets.some((target) => target.unitId === selectedTargetId)) selectedTargetId = null;
    const selectedWeapon = weapons.find((weapon) => weapon.id === selectedWeaponId) ?? null;
    const precisionOptions = selectedWeapon?.characteristics?.precision === true && selectedTargetId
      ? getPrecisionAllocationOptions(state, selectedTargetId)
      : [];
    if (!precisionOptions.some((option) => option.unitId === precisionAllocationId)) precisionAllocationId = null;

    const missionActionOptions = missionActions
      .map((action) => `<option value="${escapeHtml(action.id)}">${escapeHtml(action.name ?? action.id)}</option>`)
      .join("");

    if (layoutMode === "tabletop") {
      const activeUnitId = selectedAttackerId ?? pendingUnitId;
      const activeSummary = tabletopUnitSummary(state, activeUnitId);
      const activeUnit = activeSummary.unit;
      const activeActivation = selectedAttackerId
        ? model.activations.find((activation) => activation.unitId === selectedAttackerId && activation.actionType === "shoot")
        : null;
      const comparison = selectedAttackerId && selectedWeaponId ? compareTargets(state, { playerId: activeUnit.ownerId, attackerId: selectedAttackerId, weapon: weapons.find(w => w.id === selectedWeaponId) }) : null;
      const targetComparison = shootingTargetComparisonCards(
        selectedAttackerId, selectedWeaponId, selectedTargetId, state, weapons, perspectivePlayerId, comparison
      );
      container.innerHTML = `<link rel="stylesheet" href="${new URL('./styles/shooting-panel.css', import.meta.url).href}"><main class="shoot-screen shoot-screen--tabletop has-army-roster${selectedTargetId ? ' is-target-selected' : ''}">
        ${renderPhaseArmyRoster(state, perspectivePlayerId)}
        ${renderCombatMapPanel({ state, phase: 'shooting', mapView,
          perspectivePlayerId: perspectivePlayerId ?? model.activePlayerId,
          selectedUnitId: activeUnitId })}

        <section class="shoot-tabletop__control-panel">
          <div class="shoot-tabletop__control-scroll">
            <header class="shoot-tabletop__phase-heading"><div><span class="kicker">SHOOTING · ACTIVE ARMY</span><h1>${escapeHtml(activeUnit?.name ?? "Select a unit")}</h1><p>${escapeHtml(activeUnit ? ownerLabel({ side: activeUnit.ownerId === perspectivePlayerId ? "self" : "opponent", ownerName: activeUnit.ownerId }) : "Tap an acting unit on the map")}</p></div><span>${model.canComplete ? "Ready to advance" : "Round " + escapeHtml(model.round)}</span></header>
            ${activeUnit ? `<div class="shoot-tabletop__unit-status"><span>${escapeHtml(activeSummary.wounds)} wounds</span><span>${escapeHtml(activeSummary.models)} models</span>${activeSummary.status ? `<span>${escapeHtml(activeSummary.status)}</span>` : ""}</div>` : ""}

            <label class="shoot-tabletop__unit-picker">Acting unit · ${escapeHtml(model.activePlayerId === perspectivePlayerId ? 'your army' : 'opponent army')}
              <select data-shooting-unit-picker><option value="">Choose unit by name…</option>
              ${[...model.candidates, ...actionOnly].map(item => `<option value="${escapeHtml(item.unitId)}" ${item.unitId === pendingUnitId ? 'selected' : ''}>${escapeHtml(item.name)} · awaiting choice</option>`).join('')}
              ${model.activations.filter(item => item.actionType === 'shoot' && !isCombatActivationFinished(state, item.unitId, 'shooting')).map(item => `<option value="${escapeHtml(item.unitId)}" ${item.unitId === selectedAttackerId ? 'selected' : ''}>${escapeHtml(item.unit.name)} · continue shooting</option>`).join('')}
              </select></label>
            ${phaseNotice}
            ${attackError ? `<p class="shoot-error" role="alert">${escapeHtml(attackError)}</p>` : ""}
            ${pendingUnit ? `<div class="shoot-tabletop__action-choice">
              <button type="button" data-choice-shoot ${actionOnly.some((unit) => unit.unitId === pendingUnitId) ? "disabled" : ""}>Shoot</button>
              <button type="button" data-choice-action-toggle aria-pressed="${String(actionPickerOpen)}">Action</button>
              <button type="button" data-choice-not-shoot>Do not shoot</button>
            </div>
            ${actionPickerOpen ? missionActionPicker.render(state, pendingUnitId, missionActions) : ""}` : ""}

            ${selectedAttackerId && activeActivation ? `<div class="shoot-tabletop__attack-controls">
              <label>Ranged weapon<select data-weapon><option value="" ${selectedWeaponId ? "" : "selected"}>Choose weapon…</option>${weapons.map((weapon) => `<option value="${escapeHtml(weapon.id)}" ${weapon.id === selectedWeaponId ? "selected" : ""}>${escapeHtml(weapon.name)}</option>`).join("")}</select></label>
              <label>Target · tap an enemy marker or choose below<select data-target><option value="" ${selectedTargetId ? "" : "selected"}>Choose target…</option>${targets.map((target) => `<option value="${escapeHtml(target.unitId)}" ${target.unitId === selectedTargetId ? "selected" : ""}>${escapeHtml(target.name)}</option>`).join("")}</select></label>
              ${precisionOptions.length ? `<label>Precision allocation · optional<select data-shoot-precision><option value="">Normal allocation</option>${precisionOptions.map((option) => `<option value="${escapeHtml(option.unitId)}" ${option.unitId === precisionAllocationId ? "selected" : ""}>${escapeHtml(option.name)}</option>`).join("")}</select><small>Choose an attached Leader only if you allocated this Precision weapon’s wounds to that Character on the tabletop.</small></label>` : ""}

            </div>` : ""}

            <section class="shoot-tabletop__advisor" aria-label="Tactical Advisor">
              <div class="shoot-tabletop__advisor-heading"><div><span class="kicker">TACTICAL ADVISOR</span><h2>Compare your targets</h2></div><span>${selectedTargetId ? "Selected target" : "Choose target"}</span></div>
              <div class="shoot-tabletop__target-comparisons">${targetComparison}</div>
              ${selectedAttackerId && selectedWeaponId && selectedTargetId ? `<details class="shoot-tabletop__selected-target" data-view-key="shoot-selected-target" open><summary>Selected target details</summary><div class="shoot-tabletop__advisor-scroll">
                ${shootingAdvisory(selectedAttackerId, selectedWeaponId, selectedTargetId, state, weapons, perspectivePlayerId, { openDetails: false, comparison })}
              </div></details>` : ''}
            </section>

            <details class="shoot-tabletop__history" data-view-key="shoot-history"><summary>Phase history · ${model.attacks.length} attacks</summary>
              <ol class="history">${model.attacks.length ? model.attacks.map((item) => historyRow(item, state, gameData)).join("") : "<li>No attacks recorded yet.</li>"}</ol>
            </details>
          </div>
          <footer class="shoot-tabletop__footer">${renderActionReceipt(session)}${selectedAttackerId && activeActivation ? `              <div class="damage-control shoot-tabletop__damage"><span class="damage-control__label">Actual damage</span><div class="damage-control__buttons"><button type="button" data-shoot-damage-minus aria-label="Decrease actual damage">−</button><strong data-shoot-damage-value>${escapeHtml(actualDamage)}</strong><button type="button" data-shoot-damage-plus aria-label="Increase actual damage">+</button></div></div>
              <button class="shoot-tabletop__record" type="button" data-attack ${selectedWeaponId && selectedTargetId ? "" : "disabled"}>Record shooting attack →</button>
              <button class="shoot-tabletop__finish" type="button" data-finish-unit>Finish unit</button>` : `<button class="complete" type="button" data-complete ${model.canComplete ? "" : "disabled"}>${model.canComplete ? "Next phase →" : "Finish remaining units"}</button>`}</footer>
        </section>
      </main>`;
    } else {
      container.innerHTML = `<main class="shoot-screen">
      <header><div><div class="kicker">LIVE BATTLE</div><h1>Shooting Phase</h1><p>Round ${escapeHtml(model.round)} · Turn ${escapeHtml(model.turn)}</p></div>
      <strong>${model.canComplete ? "All Shooting choices recorded" : "Resolve the next eligible unit"}</strong></header>
      ${phaseNotice}
      ${attackError ? `<p class="shoot-error" role="alert">${escapeHtml(attackError)}</p>` : ""}
      <p class="note">Select a unit, then record whether it Shoots, performs an Action, or Does not shoot. The app records the choice; range, visibility, modifiers, action eligibility and dice remain table-side decisions.</p>

      <section>
        <div class="heading"><h2>Eligible units</h2><span>${model.candidates.length} remaining</span></div>
        <div class="candidates">${model.candidates.length ? model.candidates.map(unitButton).join("") : "<p>None</p>"}</div>
        ${actionOnly.length ? `<div class="heading"><h3>No ranged weapons · optional Actions</h3></div><p>These units do not need a Shooting choice to finish this phase. Select one only if recording an Action.</p><div class="candidates">${actionOnly.map(unitButton).join("")}</div>` : ""}
        ${pendingUnit ? `<div class="choice">
          <div><strong>${escapeHtml(pendingUnit.name)}</strong><span>${escapeHtml(ownerLabel(pendingUnit))} — choose this unit's Shooting-phase choice</span></div>
          <div class="choice-buttons">
            <button type="button" data-choice-shoot ${actionOnly.some(unit => unit.unitId === pendingUnitId) ? "disabled" : ""}>Shoot</button>
            <button type="button" data-choice-not-shoot>Do not shoot</button>
            <label>Action<select data-choice-action>
              <option value="">Select an action</option>
              ${missionActionOptions}
            </select></label>
            <button type="button" data-choice-action-confirm disabled>Record Action</button>
            <button type="button" data-choice-cancel>Cancel</button>
          </div>
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
      <footer><button class="complete" type="button" data-complete ${model.canComplete ? "" : "disabled"}>End Shooting Phase</button></footer>
    </main>`;
    }

    restoreView();
    const selection = [selectedAttackerId, selectedWeaponId, selectedTargetId].join(':');
    if (selection !== lastRenderedSelection) {
      const controls = container.querySelector?.('.shoot-tabletop__control-scroll');
      if (controls) controls.scrollTop = 0;
      lastRenderedSelection = selection;
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
      selectedAttackerId = null;
      selectedWeaponId = null;
      selectedTargetId = null;
      precisionAllocationId = null;
      actionPickerOpen = false;
      render();
    }));

    if (layoutMode === "tabletop") {
      const selectMapUnit = (unitId) => {
        if (!unitId) return;
        const pendingAttacker = state.units.find((unit) => unit.id === pendingUnitId);
        const tappedUnit = state.units.find((unit) => unit.id === unitId);
        if (!selectedAttackerId && pendingAttacker && tappedUnit?.status === "deployed" &&
            tappedUnit.ownerId !== pendingAttacker.ownerId &&
            model.candidates.some((unit) => unit.unitId === pendingUnitId)) {
          beginShoot(pendingUnitId, { targetId: unitId });
          return;
        }
        if (selectedAttackerId && targets.some((target) => target.unitId === unitId)) {
          selectedTargetId = unitId;
          precisionAllocationId = null;
          attackError = "";
          render();
          return;
        }
        if ([...model.candidates, ...actionOnly].some((unit) => unit.unitId === unitId)) {
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
        if (model.activations.some((activation) => activation.unitId === unitId && activation.actionType === "shoot") && !isCombatActivationFinished(state, unitId, "shooting")) {
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
      mapView.bind(container);
      container.querySelector("[data-shooting-unit-picker]")?.addEventListener("change", event => selectMapUnit(event.target.value));
      container.querySelectorAll?.("[data-map-unit-id]").forEach((marker) => {
        const unitId = marker.getAttribute?.("data-map-unit-id");
        const isTarget = Boolean(selectedAttackerId && targets.some((target) => target.unitId === unitId));
        marker.setAttribute?.("role", "button");
        marker.setAttribute?.("tabindex", "0");
        marker.setAttribute?.("aria-pressed", unitId === selectedTargetId ? "true" : "false");
        if (isTarget) marker.setAttribute?.("data-shoot-target-marker", "true");
        if (marker.style) marker.style.touchAction = "manipulation";
        marker.addEventListener?.("click", () => selectMapUnit(unitId));
        marker.addEventListener?.("keydown", (event) => {
          if (event?.key === "Enter" || event?.key === " ") {
            event.preventDefault?.();
            selectMapUnit(unitId);
          }
        });
      });
      container.querySelectorAll?.("[data-advisor-target]").forEach((button) => button.addEventListener?.("click", () => {
        selectedTargetId = button.getAttribute?.("data-advisor-target") || null;
        precisionAllocationId = null;
        attackError = "";
        render();
      }));
      container.querySelector?.("[data-choice-action-toggle]")?.addEventListener?.("click", () => {
        actionPickerOpen = !actionPickerOpen;
        attackError = "";
        render();
      });
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

    if (layoutMode === "tabletop" && actionPickerOpen) {
      missionActionPicker.bind(container, payload => {
        if (!pendingUnitId || !tryActivate({unitId:pendingUnitId,actionType:"mission_action",...payload})) return;
        actionPickerOpen=false; clearPending(); render();
      }, render);
    } else {
      container.querySelector("[data-choice-action]")?.addEventListener("change", event => {
        const button=container.querySelector("[data-choice-action-confirm]"); if (button) button.disabled=!event.target.value;
      });
      container.querySelector("[data-choice-action-confirm]")?.addEventListener("click", () => {
        const actionId=container.querySelector("[data-choice-action]")?.value;
        if (!pendingUnitId||!actionId||!tryActivate({unitId:pendingUnitId,actionType:"mission_action",actionId})) return;
        actionPickerOpen=false; clearPending(); render();
      });
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
      attackError = "";
      deferRenderAfterSelectDismissal(select);
    }));
    container.querySelectorAll("[data-target]").forEach(select => select.addEventListener("change", event => {
      const select = event.currentTarget ?? event.target;
      selectedTargetId = select.value || null;
      precisionAllocationId = null;
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
        selectedTargetId = null;
        precisionAllocationId = null;
        actualDamage = "0";
        attackError = "";
      } catch (error) {
        attackError = error?.message ?? String(error);
      }
      render();
    });
    container.querySelector("[data-complete]")?.addEventListener("click", () => {
      try { finishShootingPhase(session); }
      catch (error) { attackError = error?.message ?? String(error); render(); }
    });

    return model;
  }

  const unsubscribe = session.subscribe(render);
  render();
  return {
    getState: () => session.getState(),
    render,
    destroy: () => { unsubscribe(); container.replaceChildren(); }
  };
}
