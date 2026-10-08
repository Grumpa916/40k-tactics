import { getFightOpportunityRecommendations } from "../rules/tactical-fight-opportunities.js";

import {
  getFightViewModel,
  getFightAttackOptions,
  getFightWeaponOptions,
  activateFightUnit,
  resolveFightAttack,
  finishFightPhase
} from "../application/fight-workflow.js";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function ownerLabel(unit) {
  return unit?.side === "self"
    ? "You"
    : unit?.side === "opponent"
      ? "Opponent"
      : unit?.ownerName ?? "Unknown";
}

function unitButton(unit, disabled) {
  const side = unit?.side ?? "unknown";
  const owner = escapeHtml(ownerLabel(unit));
  const name = escapeHtml(unit?.name ?? unit?.unitId);

  return `
    <button
      class="fight-unit fight-unit--${side}"
      type="button"
      data-fight-unit="${escapeHtml(unit?.unitId)}"
      ${disabled ? "disabled" : ""}
    >
      <span class="fight-unit__name">${name}</span>
      <span class="fight-unit__owner">${owner}</span>
      <span class="fight-unit__action">${disabled ? "Waiting" : "Activated by"} tap</span>
    </button>
  `;
}

function candidateSection(title, candidates, blocked) {
  if (!candidates.length) {
    return `
      <section class="fight-section">
        <div class="fight-section__heading">
          <h2>${escapeHtml(title)}</h2>
          <span class="fight-section__empty">None</span>
        </div>
      </section>
    `;
  }

  return `
    <section class="fight-section">
      <div class="fight-section__heading">
        <h2>${escapeHtml(title)}</h2>
        <span class="fight-section__hint">
          ${blocked ? "Fights First still available" : "Tap whichever unit activates"}
        </span>
      </div>
      <div class="fight-candidates">
        ${candidates.map((unit) => unitButton(unit, blocked && title === "Normal")).join("")}
      </div>
    </section>
  `;
}

function attackRow(attack, state, gameData) {
  const attacker = state.units.find((unit) => unit?.id === attack.attackerId);
  const target = state.units.find((unit) => unit?.id === attack.targetId);
  const weapon = gameData?.weapons?.find((item) => item?.id === attack.weaponId);
  const status = attack.targetStatusAfter === "destroyed"
    ? "Destroyed"
    : attack.targetWoundsAfter == null ? "" : `${attack.targetWoundsAfter} wounds remaining`;
  const result = `${attack.actualDamage ?? attack.totalDamage ?? 0} actual damage · ${attack.expectedDamage ?? attack.totalDamage ?? 0} expected${status ? ` · ${status}` : ""}`;
  return `
    <li class="fight-history__item">
      <span class="fight-history__number">⚔</span>
      <span class="fight-history__main">
        <strong>${escapeHtml(attacker?.name ?? attack.attackerId)} → ${escapeHtml(target?.name ?? attack.targetId)}</strong>
        <span>${escapeHtml(weapon?.name ?? attack.weaponId ?? "Weapon")}</span>
      </span>
      <span class="fight-history__stats">${escapeHtml(result)}</span>
    </li>
  `;
}

function fightAdvisory(attackerId, weaponId, targetId, state, weapons, perspectivePlayerId) {
  if (!attackerId || !weaponId || !targetId) return "";

  const weapon = weapons.find((item) => item.id === weaponId);
  if (!weapon) return "";

  const recommendations = getFightOpportunityRecommendations(state, {
    playerId: perspectivePlayerId,
    options: [{
      unitId: attackerId,
      targetUnitId: targetId,
      weapon
    }]
  });
  const recommendation = recommendations[0];
  if (!recommendation) return "";

  const expectedDamage = Number.isFinite(recommendation.expectedDamage)
    ? recommendation.expectedDamage.toFixed(1)
    : "—";
  const retaliation = Number.isFinite(recommendation.retaliationExpectedDamage)
    ? recommendation.retaliationExpectedDamage.toFixed(1)
    : "—";
  const survival = Number.isFinite(recommendation.targetSurvivalProbability)
    ? Math.round(recommendation.targetSurvivalProbability * 100) + "%"
    : "—";
  const destruction = Number.isFinite(recommendation.targetDestructionProbability)
    ? Math.round(recommendation.targetDestructionProbability * 100) + "%"
    : "—";

  return `
    <aside class="fight-advisory" data-fight-advisory>
      <div class="fight-section__heading">
        <h2>Fight Advisor</h2>
        <span class="fight-section__hint">${escapeHtml(recommendation.confidence)} confidence</span>
      </div>
      <div class="fight-advisory__grid">
        <div><strong>${expectedDamage}</strong><span>expected damage</span></div>
        <div><strong>${retaliation}</strong><span>expected retaliation</span></div>
        <div><strong>${survival}</strong><span>target survival</span></div>
        <div><strong>${destruction}</strong><span>target destruction</span></div>
      </div>
      <p>${escapeHtml(recommendation.reason)}</p>
    </aside>
  `;
}

function activationRow(activation, index) {
  const owner = escapeHtml(ownerLabel(activation.unit));
  const name = escapeHtml(activation.unit?.name ?? activation.unitId);
  const priority = activation.fightsFirst ? "Fights First" : "Normal";
  const damage = activation.totalDamage ?? 0;
  const attacks = activation.attackCount ?? 0;

  return `
    <li class="fight-history__item">
      <span class="fight-history__number">${index + 1}</span>
      <span class="fight-history__main">
        <strong>${name}</strong>
        <span>${owner} · ${priority}</span>
      </span>
      <span class="fight-history__stats">${attacks} attacks · ${damage} damage</span>
    </li>
  `;
}

export function createFightScreen(
  container,
  { session, perspectivePlayerId = null, gameData = null } = {}
) {
  if (!container || typeof container.replaceChildren !== "function") {
    throw new TypeError("A browser container element is required.");
  }
  if (!session || typeof session.getState !== "function" || typeof session.subscribe !== "function") {
    throw new TypeError("A game session is required.");
  }

  let selectedAttackerId = null;
  let selectedWeaponId = null;
  let selectedTargetId = null;
  let actualDamage = "0";

  function render() {
    const state = session.getState();
    const model = getFightViewModel(state, { perspectivePlayerId });
    const hasFirst = model.candidates.fightsFirst.length > 0;
    const attackOptions = getFightAttackOptions(state, { attackerId: selectedAttackerId, perspectivePlayerId });
    const weapons = getFightWeaponOptions(state, { attackerId: selectedAttackerId, gameData });

    if (!attackOptions.attackers.some((unit) => unit.unitId === selectedAttackerId)) {
      selectedAttackerId = null;
      selectedWeaponId = null;
      selectedTargetId = null;
    }
    if (!weapons.some((weapon) => weapon.id === selectedWeaponId)) selectedWeaponId = null;
    if (!attackOptions.targets.some((unit) => unit.unitId === selectedTargetId)) selectedTargetId = null;

    container.innerHTML = `
      <main class="fight-screen">
        <header class="fight-header">
          <div>
            <div class="fight-kicker">LIVE BATTLE</div>
            <h1>Fight Phase</h1>
            <p>Round ${escapeHtml(model.round)} · Turn ${escapeHtml(model.turn)}</p>
          </div>
          <div class="fight-status" data-fight-status>
            ${model.canComplete ? "All activations recorded" : "Record the next unit that activates"}
          </div>
        </header>

        <div class="fight-note">
          Select whichever unit actually activates at the table. The app records either side and does not enforce alternating selection order.
        </div>

        ${candidateSection("Fights First", model.candidates.fightsFirst, false)}
        ${candidateSection("Normal", model.candidates.normal, hasFirst)}

        <div class="fight-main-grid">
          <section class="fight-section">
          <div class="fight-section__heading"><h2>Attack entry</h2><span class="fight-section__hint">Select an activated unit, weapon, then target</span></div>
          <div class="fight-attack-entry">
            <label>Attacker<select data-fight-attacker><option value="">Select attacker</option>${attackOptions.attackers.map((unit) => `<option value="${escapeHtml(unit.unitId)}" ${unit.unitId === selectedAttackerId ? "selected" : ""}>${escapeHtml(unit.name)} · ${escapeHtml(ownerLabel(unit))}</option>`).join("")}</select></label>
            <label>Weapon<select data-fight-weapon ${selectedAttackerId ? "" : "disabled"}><option value="">Select melee weapon</option>${weapons.map((weapon) => `<option value="${escapeHtml(weapon.id)}" ${weapon.id === selectedWeaponId ? "selected" : ""}>${escapeHtml(weapon.name)}</option>`).join("")}</select></label>
            <label>Target<select data-fight-target ${selectedAttackerId ? "" : "disabled"}><option value="">Select enemy target</option>${attackOptions.targets.map((unit) => `<option value="${escapeHtml(unit.unitId)}" ${unit.unitId === selectedTargetId ? "selected" : ""}>${escapeHtml(unit.name)} · ${escapeHtml(ownerLabel(unit))}</option>`).join("")}</select></label>
            ${fightAdvisory(selectedAttackerId, selectedWeaponId, selectedTargetId, state, weapons, perspectivePlayerId)}
            <div class="damage-control">
              <span class="damage-control__label">Actual damage</span>
              <div class="damage-control__buttons">
                <button type="button" data-fight-damage-minus aria-label="Decrease actual damage">−</button>
                <strong data-fight-damage-value">${escapeHtml(actualDamage)}</strong>
                <button type="button" data-fight-damage-plus aria-label="Increase actual damage">+</button>
              </div>
              <small>Expected damage is calculated automatically and retained in the attack result.</small>
            </div>
            <button type="button" data-fight-attack ${selectedAttackerId && selectedWeaponId && selectedTargetId ? "" : "disabled"}>Record Attack</button>
          </div>
        </section>

        <section class="fight-section">
          <div class="fight-section__heading">
            <h2>Activation history</h2>
            <span class="fight-section__hint">${model.activations.length} recorded</span>
          </div>
          <ol class="fight-history">
            ${model.activations.length
              ? model.activations.map(activationRow).join("")
              : '<li class="fight-history__empty">No Fight activations recorded yet.</li>'}
          </ol>
        </section>
        <section class="fight-section">
          <div class="fight-section__heading">
            <h2>Attack results</h2>
            <span class="fight-section__hint">${model.attacks.length} recorded</span>
          </div>
          <ol class="fight-history">
            ${model.attacks.length ? model.attacks.map((attack) => attackRow(attack, state, gameData)).join("") : '<li class="fight-history__empty">No attacks recorded yet.</li>'}
          </ol>
        </section>

        </div>

        <footer class="fight-footer">
          <button class="fight-complete" type="button" data-fight-complete ${model.canComplete ? "" : "disabled"}>
            End Fight Phase
          </button>
        </footer>
      </main>
    `;

    const attackerSelect = container.querySelector("[data-fight-attacker]");
    attackerSelect?.addEventListener("change", () => {
      selectedAttackerId = attackerSelect.value || null;
      selectedWeaponId = null;
      selectedTargetId = null;
      actualDamage = "0";
      render();
    });
    container.querySelector("[data-fight-weapon]")?.addEventListener("change", (event) => {
      selectedWeaponId = event.target.value || null;
      render();
    });
    container.querySelector("[data-fight-target]")?.addEventListener("change", (event) => {
      selectedTargetId = event.target.value || null;
      render();
    });
    container.querySelector("[data-fight-damage-minus]")?.addEventListener("click", () => {
      actualDamage = String(Math.max(0, Number(actualDamage) - 1));
      render();
    });
    container.querySelector("[data-fight-damage-plus]")?.addEventListener("click", () => {
      actualDamage = String(Number(actualDamage) + 1);
      render();
    });
    container.querySelector("[data-fight-attack]")?.addEventListener("click", () => {
      const weapon = weapons.find((item) => item.id === selectedWeaponId);
      if (!weapon) return;
      const damage = Number(actualDamage);
      if (!Number.isInteger(damage) || damage < 0) return;
      resolveFightAttack(session, { attackerId: selectedAttackerId, targetId: selectedTargetId, weapon, actualDamage: damage });
      selectedTargetId = null;
      actualDamage = "0";
      render();
    });

    container.querySelectorAll("[data-fight-unit]").forEach((button) => {
      button.addEventListener("click", () => {
        activateFightUnit(session, {
          unitId: button.getAttribute("data-fight-unit")
        });
      });
    });

    const complete = container.querySelector("[data-fight-complete]");
    complete?.addEventListener("click", () => {
      finishFightPhase(session);
    });

    return model;
  }

  const unsubscribe = session.subscribe(render);
  render();

  return {
    getState: () => session.getState(),
    render,
    destroy: () => {
      unsubscribe();
      container.replaceChildren();
    }
  };
}
