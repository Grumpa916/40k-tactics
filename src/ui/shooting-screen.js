import {
  getShootingViewModel,
  getShootingWeaponOptions,
  getShootingTargetOptions,
  activateShootingUnit,
  resolveShootingAttack,
  finishShootingPhase
} from "../application/shooting-workflow.js";
import { getShootingTargetPriorities } from "../rules/tactical-shooting-targets.js";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function ownerLabel(unit) {
  return unit?.side === "self" ? "You" : unit?.side === "opponent" ? "Opponent" : unit?.ownerName ?? "Unknown";
}

function actionLabel(activation) {
  if (activation.actionType === "mission_action") return `Action: ${activation.actionId ?? "Mission Action"}`;
  if (activation.actionType === "special_action") return `Special Action: ${activation.actionId ?? "Special Action"}`;
  return "Shoot";
}

function unitButton(unit) {
  return `<button class="shoot-unit shoot-unit--${unit.side ?? "unknown"}" type="button" data-shoot-unit="${escapeHtml(unit.unitId)}">
    <strong>${escapeHtml(unit.name)}</strong><span>${escapeHtml(ownerLabel(unit))}</span><small>Tap to choose Shoot or Action</small>
  </button>`;
}


function shootingAdvisory(attackerId, weaponId, targetId, state, weapons, perspectivePlayerId) {
  if (!attackerId || !weaponId || !targetId || !perspectivePlayerId) return "";
  const weapon = weapons.find((item) => item.id === weaponId);
  if (!weapon) return "";
  const result = getShootingTargetPriorities(state, { playerId: perspectivePlayerId, attackerId, weapon });
  const recommendation = result.priorities.find((item) => item.targetUnitId === targetId);
  if (!recommendation) return "";
  const expected = Number.isFinite(recommendation.expectedDamage) ? recommendation.expectedDamage.toFixed(1) : "—";
  const destruction = Number.isFinite(recommendation.destructionProbability) ? Math.round(recommendation.destructionProbability * 100) + "%" : "—";
  const survival = Number.isFinite(recommendation.survivalProbability) ? Math.round(recommendation.survivalProbability * 100) + "%" : "—";
  const impact = recommendation.impactClassification === "unknown" ? "Unknown" : recommendation.impactClassification.replaceAll("-", " ");
  const targetImpact = Number.isFinite(recommendation.normalizedImpact) ? Math.round(recommendation.normalizedImpact * 100) + "%" : "—";
  const confidence = recommendation.confidence ? recommendation.confidence : "low";
  const rangeConfidence = recommendation.rangeConfidence ? recommendation.rangeConfidence : "low";
  return `
    <aside class="shoot-advisory" data-shoot-advisory>
      <div class="shoot-advisory__heading"><h3>Shooting Advisor</h3><span>${escapeHtml(recommendation.rangeStatus)} range</span></div>
      <div class="shoot-advisory__grid">
        <div><strong>${expected}</strong><span>expected damage</span></div>
        <div><strong>${destruction}</strong><span>destruction chance</span></div>
        <div><strong>${survival}</strong><span>target survival</span></div>
        <div><strong>${targetImpact}</strong><span>target impact</span></div>
        <div><strong>${escapeHtml(impact)}</strong><span>outcome profile</span></div>
      </div>
      <p>${escapeHtml(recommendation.recommendationReason || recommendation.reason)}</p>
      <small>Advisor confidence: ${escapeHtml(confidence)} · Range confidence: ${escapeHtml(rangeConfidence)}</small>
    </aside>
  `;
}

function historyRow(item, state, gameData) {
  const attacker = state.units.find((unit) => unit?.id === item.attackerId);
  const target = state.units.find((unit) => unit?.id === item.targetId);
  const weapon = gameData?.weapons?.find((entry) => entry?.id === item.weaponId);
  const result = item.targetStatusAfter === "destroyed"
    ? "Destroyed"
    : item.targetWoundsAfter == null ? `${item.actualDamage ?? item.totalDamage ?? 0} actual · ${item.expectedDamage ?? item.totalDamage ?? 0} expected` : `${item.actualDamage ?? item.totalDamage ?? 0} actual · ${item.expectedDamage ?? item.totalDamage ?? 0} expected · ${item.targetWoundsAfter} wounds`;
  return `<li><strong>${escapeHtml(attacker?.name ?? item.attackerId)} → ${escapeHtml(target?.name ?? item.targetId)}</strong><span>${escapeHtml(weapon?.name ?? item.weaponId ?? "Weapon")} · ${escapeHtml(result)}</span></li>`;
}

export function createShootingScreen(container, {
  session,
  perspectivePlayerId = null,
  gameData = null,
  missionActions = []
} = {}) {
  if (!container || typeof container.replaceChildren !== "function") throw new TypeError("A browser container element is required.");
  if (!session || typeof session.getState !== "function" || typeof session.subscribe !== "function") throw new TypeError("A game session is required.");

  let pendingUnitId = null;
  let selectedAttackerId = null;
  let selectedWeaponId = null;
  let selectedTargetId = null;
  let actualDamage = "0";

  function clearPending() {
    pendingUnitId = null;
  }

  function render() {
    const state = session.getState();
    const model = getShootingViewModel(state, { perspectivePlayerId });
    const weapons = getShootingWeaponOptions(state, { attackerId: selectedAttackerId, gameData });
    const targets = getShootingTargetOptions(state, { attackerId: selectedAttackerId, perspectivePlayerId });
    const pendingUnit = model.candidates.find((unit) => unit.unitId === pendingUnitId);

    if (selectedAttackerId && !model.activations.some((activation) =>
      activation.unitId === selectedAttackerId && activation.actionType === "shoot"
    )) {
      selectedAttackerId = null;
      selectedWeaponId = null;
      selectedTargetId = null;
    }
    if (!weapons.some((weapon) => weapon.id === selectedWeaponId)) selectedWeaponId = null;
    if (!targets.some((target) => target.unitId === selectedTargetId)) selectedTargetId = null;

    const missionActionOptions = missionActions
      .map((action) => `<option value="${escapeHtml(action.id)}">${escapeHtml(action.name ?? action.id)}</option>`)
      .join("");

    container.innerHTML = `<main class="shoot-screen">
      <header><div><div class="kicker">LIVE BATTLE</div><h1>Shooting Phase</h1><p>Round ${escapeHtml(model.round)} · Turn ${escapeHtml(model.turn)}</p></div>
      <strong>${model.canComplete ? "All Shooting choices recorded" : "Resolve the next eligible unit"}</strong></header>
      <p class="note">Select a unit, then record whether it Shoots or performs a mission/special Action. The app records the choice; range, visibility, modifiers, action eligibility and dice remain table-side decisions.</p>

      <section>
        <div class="heading"><h2>Eligible units</h2><span>${model.candidates.length} remaining</span></div>
        <div class="candidates">${model.candidates.length ? model.candidates.map(unitButton).join("") : "<p>None</p>"}</div>
        ${pendingUnit ? `<div class="choice">
          <div><strong>${escapeHtml(pendingUnit.name)}</strong><span>${escapeHtml(ownerLabel(pendingUnit))} — choose this unit's Shooting-phase choice</span></div>
          <div class="choice-buttons">
            <button type="button" data-choice-shoot>Shoot</button>
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
            <label>Weapon<select data-weapon ${selectedAttackerId ? "" : "disabled"}><option value="">Select ranged weapon</option>${weapons.map((weapon) => `<option value="${escapeHtml(weapon.id)}" ${weapon.id === selectedWeaponId ? "selected" : ""}>${escapeHtml(weapon.name)}</option>`).join("")}</select></label>
            <label>Target<select data-target ${selectedAttackerId ? "" : "disabled"}><option value="">Select enemy target</option>${targets.map((target) => `<option value="${escapeHtml(target.unitId)}" ${target.unitId === selectedTargetId ? "selected" : ""}>${escapeHtml(target.name)} · ${escapeHtml(ownerLabel(target))}</option>`).join("")}</select></label>
            <div class="damage-control">
              <span class="damage-control__label">Actual damage</span>
              <div class="damage-control__buttons">
                <button type="button" data-shoot-damage-minus aria-label="Decrease actual damage">−</button>
                <strong data-shoot-damage-value">${escapeHtml(actualDamage)}</strong>
                <button type="button" data-shoot-damage-plus aria-label="Increase actual damage">+</button>
              </div>
              <small>Expected damage is calculated automatically and retained in the attack result.</small>
            </div>
            <button type="button" data-attack ${selectedAttackerId && selectedWeaponId && selectedTargetId ? "" : "disabled"}>Record Attack</button>
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

    container.querySelectorAll("[data-shoot-unit]").forEach((button) => button.addEventListener("click", () => {
      pendingUnitId = button.getAttribute("data-shoot-unit");
      selectedAttackerId = null;
      selectedWeaponId = null;
      selectedTargetId = null;
      render();
    }));

    container.querySelector("[data-choice-shoot]")?.addEventListener("click", () => {
      if (!pendingUnitId) return;
      const unitId = pendingUnitId;
      activateShootingUnit(session, { unitId, actionType: "shoot" });
      selectedAttackerId = unitId;
      const availableWeapons = getShootingWeaponOptions(session.getState(), { attackerId: unitId, gameData });
      selectedWeaponId = availableWeapons.length === 1 ? availableWeapons[0].id : null;
      selectedTargetId = null;
      actualDamage = "0";
      clearPending();
      render();
    });

    container.querySelector("[data-choice-action]")?.addEventListener("change", (event) => {
      const button = container.querySelector("[data-choice-action-confirm]");
      if (button) button.disabled = !event.target.value;
    });

    container.querySelector("[data-choice-action-confirm]")?.addEventListener("click", () => {
      const actionId = container.querySelector("[data-choice-action]")?.value;
      if (!pendingUnitId || !actionId) return;
      activateShootingUnit(session, { unitId: pendingUnitId, actionType: "mission_action", actionId });
      clearPending();
    });

    container.querySelector("[data-choice-cancel]")?.addEventListener("click", () => {
      clearPending();
      render();
    });


    container.querySelector("[data-weapon]")?.addEventListener("change", (event) => { selectedWeaponId = event.target.value || null; render(); });
    container.querySelector("[data-target]")?.addEventListener("change", (event) => { selectedTargetId = event.target.value || null; render(); });
    container.querySelector("[data-shoot-damage-minus]")?.addEventListener("click", () => {
      actualDamage = String(Math.max(0, Number(actualDamage) - 1));
      render();
    });
    container.querySelector("[data-shoot-damage-plus]")?.addEventListener("click", () => {
      actualDamage = String(Number(actualDamage) + 1);
      render();
    });
    container.querySelector("[data-attack]")?.addEventListener("click", () => {
      const weapon = weapons.find((item) => item.id === selectedWeaponId);
      if (!weapon) return;
      const damage = Number(actualDamage);
      if (!Number.isInteger(damage) || damage < 0) return;
      resolveShootingAttack(session, { attackerId: selectedAttackerId, targetId: selectedTargetId, weapon, actualDamage: damage });
      selectedTargetId = null;
      actualDamage = "0";
      render();
    });
    container.querySelector("[data-complete]")?.addEventListener("click", () => finishShootingPhase(session));

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
