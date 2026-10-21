import { createMissionActionPicker } from "./mission-action-picker.js";
import {
  getShootingViewModel,
  getShootingWeaponOptions,
  getShootingTargetOptions,
  activateShootingUnit,
  resolveShootingAttack,
  finishShootingPhase
} from "../application/shooting-workflow.js";
import { getShootingTargetComparison } from "../rules/tactical-shooting-comparison.js";
import { getAttackDamageForecast } from "../rules/attack-damage-forecast.js";
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
  const wounds = Number.isFinite(unit.wounds) ? String(unit.wounds) : "—";
  const models = Array.isArray(unit.models)
    ? unit.models.length
    : Number.isFinite(unit.modelCount) ? unit.modelCount : Number.isFinite(unit.models) ? unit.models : "—";
  const status = unit.battleShocked || unit.battleshocked || unit.status === "battle_shocked" ? "Battle-shocked" : "";
  return { unit, wounds, models: String(models), status };
}

function shootingTargetComparisonCards(attackerId, weaponId, selectedTargetId, state, weapons, perspectivePlayerId) {
  if (!attackerId || !weaponId || !perspectivePlayerId) return '<p class="shoot-tabletop__empty-advice">Choose a shooter and weapon to compare targets.</p>';
  const weapon = weapons.find((item) => item.id === weaponId);
  if (!weapon) return '<p class="shoot-tabletop__empty-advice">Choose a valid ranged weapon to compare targets.</p>';
  const result = getShootingTargetComparison(state, { playerId: state.units.find(unit => unit.id === attackerId)?.ownerId ?? perspectivePlayerId, attackerId, weapon });
  if (!result.comparisons.length) return '<p class="shoot-tabletop__empty-advice">No eligible targets are available for comparison.</p>';
  return '<div class="shoot-tabletop__comparison-list">' + result.comparisons.slice(0, 5).map((item) => {
    const destroy = Number.isFinite(item.destructionProbability) ? Math.round(item.destructionProbability * 100) + '%' : '—';
    const expected = Number.isFinite(item.expectedDamage) ? item.expectedDamage.toFixed(1) : '—';
    const mission = item.secondaryMissionImpact?.score >= item.primaryMissionImpact?.score
      ? item.secondaryMissionImpact?.label ?? 'none'
      : item.primaryMissionImpact?.label ?? 'none';
    return `<button type="button" class="shoot-tabletop__comparison${item.targetUnitId === selectedTargetId ? ' is-selected' : ''}" data-advisor-target="${escapeHtml(item.targetUnitId)}">
      <span><strong>#${item.rank} ${escapeHtml(item.targetName)}</strong><small>${escapeHtml(item.recommendation)}</small></span>
      <span class="shoot-tabletop__comparison-stats"><b>${expected}</b><small>mean</small><b>${destroy}</b><small>destroy</small><b>${escapeHtml(mission)}</b><small>mission</small></span>
    </button>`;
  }).join('') + '</div>';
}

function shootingAdvisory(attackerId, weaponId, targetId, state, weapons, perspectivePlayerId, { openDetails = false } = {}) {
  if (!attackerId || !weaponId || !targetId || !perspectivePlayerId) return "";
  const weapon = weapons.find((item) => item.id === weaponId);
  if (!weapon) return "";
  const result = getShootingTargetComparison(state, { playerId: state.units.find(unit => unit.id === attackerId)?.ownerId ?? perspectivePlayerId, attackerId, weapon });
  const recommendation = result.comparisons.find((item) => item.targetUnitId === targetId);
  if (!recommendation) return "";
  const expected = Number.isFinite(recommendation.expectedDamage) ? recommendation.expectedDamage.toFixed(1) : "—";
  const expectedOrMore = Number.isFinite(recommendation.probabilityAtLeastExpectedDamage)
    ? Math.round(recommendation.probabilityAtLeastExpectedDamage * 100) + "%"
    : "—";
  const destruction = Number.isFinite(recommendation.destructionProbability)
    ? Math.round(recommendation.destructionProbability * 100) + "%"
    : "—";
  const primaryImpact = recommendation.primaryMissionImpact?.label ?? "none";
  const secondaryImpact = recommendation.secondaryMissionImpact?.label ?? "none";
  const threat = recommendation.recentThreat?.label ?? "none";
  const impact = recommendation.impactClassification === "unknown"
    ? "Unknown"
    : recommendation.impactClassification.replaceAll("-", " ");
  const confidence = recommendation.confidence ? recommendation.confidence : "low";
  const rangeConfidence = recommendation.rangeConfidence ? recommendation.rangeConfidence : "low";
  const unresolved = recommendation.secondaryMissionImpact?.unresolvedMissions ?? [];
  return `
    <aside class="shoot-advisory" data-shoot-advisory>
      <div class="shoot-advisory__heading"><h3>Shooting Advisor</h3><span>${escapeHtml(recommendation.rangeStatus)} range</span></div>
      <div class="shoot-advisory__grid">
        <div><strong>${expected}</strong><span>expected damage</span></div>
        <div><strong>${expectedOrMore}</strong><span>chance of ${escapeHtml(recommendation.expectedDamageThreshold ?? "expected")}+ damage</span></div>
        <div><strong>${destruction}</strong><span>destruction chance</span></div>
        <div><strong>${escapeHtml(primaryImpact)}</strong><span>Primary impact</span></div>
        <div><strong>${escapeHtml(secondaryImpact)}</strong><span>Secondary impact</span></div>
        <div><strong>${escapeHtml(threat)}</strong><span>recent threat</span></div>
        <div><strong>${escapeHtml(impact)}</strong><span>outcome profile</span></div>
      </div>
      <p>${escapeHtml(recommendation.recommendation)}</p>
      <details class="shoot-advisory__details" ${openDetails ? "open" : ""}><summary>Advisor assumptions &amp; detail</summary>
        <p>${escapeHtml(recommendation.primaryMissionImpact?.reason ?? "")}</p>
        <p>${escapeHtml(recommendation.secondaryMissionImpact?.reason ?? "")}</p>
        <p>${escapeHtml(recommendation.recentThreat?.reason ?? "")}</p>
        ${unresolved.length ? `<p>Not used for ranking until verified: ${escapeHtml(unresolved.join(", "))}.</p>` : ""}
        <small>${recommendation.assumptions.map(escapeHtml).join(" · ")}</small>
      </details>
      <small>Advisor confidence: ${escapeHtml(confidence)} · Range confidence: ${escapeHtml(rangeConfidence)}</small>
    </aside>
  `;
}

function shootingDamageForecast(attackerId, weaponId, targetId, state, weapons) {
  if (!attackerId || !weaponId || !targetId) return "";
  const weapon = weapons.find((item) => item.id === weaponId);
  if (!weapon) return "";
  const forecast = getAttackDamageForecast(state, { attackerId, targetId, weapon });
  if (!forecast) {
    return `
      <aside class="shoot-advisory" data-shoot-damage-forecast>
        <div class="shoot-advisory__heading"><h3>Damage outlook</h3><span>table result remains authoritative</span></div>
        <p>Expected damage is unavailable because one or more saved combat characteristics are incomplete.</p>
      </aside>
    `;
  }
  const expected = forecast.expectedDamage.toFixed(1);
  const thresholdChance = Math.round(forecast.probabilityAtLeastThreshold * 100) + "%";
  const anyDamageChance = Math.round(forecast.probabilityAnyDamage * 100) + "%";
  return `
    <aside class="shoot-advisory" data-shoot-damage-forecast>
      <div class="shoot-advisory__heading"><h3>Damage outlook</h3><span>baseline probability</span></div>
      <div class="shoot-advisory__grid">
        <div><strong>${escapeHtml(expected)}</strong><span>expected damage</span></div>
        <div><strong>${escapeHtml(thresholdChance)}</strong><span>chance of ${escapeHtml(forecast.thresholdDamage)}+ damage</span></div>
        <div><strong>${escapeHtml(anyDamageChance)}</strong><span>chance to cause any damage</span></div>
      </div>
      <small>Uses saved profiles and known weapon characteristics. Exact tabletop modifiers and dice remain authoritative.</small>
    </aside>
  `;
}
function historyRow(item, state, gameData) {
  const attacker = state.units.find((unit) => unit?.id === item.attackerId);
  const target = state.units.find((unit) => unit?.id === item.targetId);
  const weapon = gameData?.weapons?.find((entry) => entry?.id === item.weaponId);
  const expectedDamage = Number.isFinite(item.expectedDamage)
    ? item.expectedDamage.toFixed(1)
    : item.expectedDamage ?? item.totalDamage ?? 0;
  const result = item.targetStatusAfter === "destroyed"
    ? "Destroyed"
    : item.targetWoundsAfter == null ? `${item.actualDamage ?? item.totalDamage ?? 0} actual · ${expectedDamage} expected` : `${item.actualDamage ?? item.totalDamage ?? 0} actual · ${expectedDamage} expected · ${item.targetWoundsAfter} wounds`;
  return `<li><strong>${escapeHtml(attacker?.name ?? item.attackerId)} → ${escapeHtml(target?.name ?? item.targetId)}</strong><span>${escapeHtml(weapon?.name ?? item.weaponId ?? "Weapon")} · ${escapeHtml(result)}</span></li>`;
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
  const missionActionPicker = createMissionActionPicker();
  let pendingUnitId = null;
  let selectedAttackerId = null;
  let selectedWeaponId = null;
  let selectedTargetId = null;
  let actualDamage = "0";
  let attackError = "";
  let actionPickerOpen = false;

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
    }

    const weapons = getShootingWeaponOptions(state, { attackerId: selectedAttackerId, gameData });
    const targets = getShootingTargetOptions(state, { attackerId: selectedAttackerId, perspectivePlayerId });
    const pendingUnit = [...model.candidates, ...actionOnly].find((unit) => unit.unitId === pendingUnitId);
    if (!weapons.some((weapon) => weapon.id === selectedWeaponId)) selectedWeaponId = null;
    if (!targets.some((target) => target.unitId === selectedTargetId)) selectedTargetId = null;

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
      const targetComparison = shootingTargetComparisonCards(
        selectedAttackerId, selectedWeaponId, selectedTargetId, state, weapons, perspectivePlayerId
      );
      const mapMarkup = mapView.render(state, {
        mode: "live",
        perspectivePlayerId: perspectivePlayerId ?? model.activePlayerId,
        interactivePlayerId: null,
        selectedUnitId: activeUnitId,
        showMeasurements: false,
        mapLabel: "Battlefield · approximate context"
      });
      container.innerHTML = `<main class="shoot-screen shoot-screen--tabletop">
        <section class="shoot-tabletop__map-panel">
          <div class="shoot-tabletop__map-heading"><div><span class="kicker">BATTLEFIELD</span><h1>Approximate tactical context</h1></div><span>${model.candidates.length} shooting choices remaining</span></div>
          <p class="shoot-tabletop__map-note">Tap an eligible acting unit, then tap an enemy marker to compare targets. Tabletop range, visibility and measurements remain authoritative.</p>
          ${mapMarkup}
        </section>

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
              <button type="button" data-choice-not-shoot>Skip</button>
            </div>
            ${actionPickerOpen ? missionActionPicker.render(state, pendingUnitId, missionActions) : ""}` : ""}

            ${selectedAttackerId && activeActivation ? `<div class="shoot-tabletop__attack-controls">
              <label>Ranged weapon<select data-weapon><option value="" ${selectedWeaponId ? "" : "selected"}>Choose weapon…</option>${weapons.map((weapon) => `<option value="${escapeHtml(weapon.id)}" ${weapon.id === selectedWeaponId ? "selected" : ""}>${escapeHtml(weapon.name)}</option>`).join("")}</select></label>
              <label>Target · tap an enemy marker or choose below<select data-target><option value="" ${selectedTargetId ? "" : "selected"}>Choose target…</option>${targets.map((target) => `<option value="${escapeHtml(target.unitId)}" ${target.unitId === selectedTargetId ? "selected" : ""}>${escapeHtml(target.name)}</option>`).join("")}</select></label>
              <div class="damage-control shoot-tabletop__damage"><span class="damage-control__label">Actual damage</span><div class="damage-control__buttons"><button type="button" data-shoot-damage-minus aria-label="Decrease actual damage">−</button><strong data-shoot-damage-value>${escapeHtml(actualDamage)}</strong><button type="button" data-shoot-damage-plus aria-label="Increase actual damage">+</button></div></div>
              <button class="shoot-tabletop__record" type="button" data-attack ${selectedWeaponId && selectedTargetId ? "" : "disabled"}>Record shooting attack →</button>
              <button class="shoot-tabletop__finish" type="button" data-finish-unit>Finish unit</button>
            </div>` : (!pendingUnit ? `<p class="shoot-tabletop__selection-help">Select one of the active army's eligible units on the battlefield to choose Shoot, Action, or Skip.</p>` : "")}

            <section class="shoot-tabletop__advisor" aria-label="Tactical Advisor">
              <div class="shoot-tabletop__advisor-heading"><div><span class="kicker">TACTICAL ADVISOR</span><h2>Compare your targets</h2></div><span>${selectedTargetId ? "Selected target" : "Choose target"}</span></div>
              ${targetComparison}
              ${selectedAttackerId && selectedWeaponId && selectedTargetId ? `<div class="shoot-tabletop__advisor-scroll">
                ${shootingDamageForecast(selectedAttackerId, selectedWeaponId, selectedTargetId, state, weapons)}
                ${shootingAdvisory(selectedAttackerId, selectedWeaponId, selectedTargetId, state, weapons, perspectivePlayerId, { openDetails: true })}
              </div>` : '<p class="shoot-tabletop__empty-advice">Select a target to show probability, Primary/Secondary impact, recent threat, recommendation and assumptions.</p>'}
            </section>

            <details class="shoot-tabletop__history"><summary>Phase history · ${model.attacks.length} attacks</summary>
              <ol class="history">${model.attacks.length ? model.attacks.map((item) => historyRow(item, state, gameData)).join("") : "<li>No attacks recorded yet.</li>"}</ol>
            </details>
          </div>
          <footer class="shoot-tabletop__footer"><button class="complete" type="button" data-complete ${model.canComplete ? "" : "disabled"}>${model.canComplete ? "Next phase →" : "Finish remaining units"}</button></footer>
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
          attackError = "";
          render();
          return;
        }
        if ([...model.candidates, ...actionOnly].some((unit) => unit.unitId === unitId)) {
          pendingUnitId = unitId;
          selectedAttackerId = null;
          selectedWeaponId = null;
          selectedTargetId = null;
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

    container.querySelector("[data-weapon]")?.addEventListener("change", (event) => {
      selectedWeaponId = event.target.value || null;
      attackError = "";
      render();
    });
    container.querySelector("[data-target]")?.addEventListener("change", (event) => {
      selectedTargetId = event.target.value || null;
      attackError = "";
      render();
    });
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
        resolveShootingAttack(session, { attackerId: selectedAttackerId, targetId, weapon, actualDamage: damage });
        selectedWeaponId = weaponId;
        selectedTargetId = null;
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
