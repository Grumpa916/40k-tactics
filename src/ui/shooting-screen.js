import {
  getShootingViewModel,
  getShootingWeaponOptions,
  getShootingTargetOptions,
  activateShootingUnit,
  resolveShootingAttack,
  finishShootingPhase
} from "../application/shooting-workflow.js";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function ownerLabel(unit) {
  return unit?.side === "self" ? "You" : unit?.side === "opponent" ? "Opponent" : unit?.ownerName ?? "Unknown";
}

function unitButton(unit) {
  return `<button class="shoot-unit shoot-unit--${unit.side ?? "unknown"}" type="button" data-shoot-unit="${escapeHtml(unit.unitId)}">
    <strong>${escapeHtml(unit.name)}</strong><span>${escapeHtml(ownerLabel(unit))}</span><small>Tap to select</small>
  </button>`;
}

function historyRow(item, state, gameData) {
  const attacker = state.units.find((unit) => unit?.id === item.attackerId);
  const target = state.units.find((unit) => unit?.id === item.targetId);
  const weapon = gameData?.weapons?.find((entry) => entry?.id === item.weaponId);
  const result = item.targetStatusAfter === "destroyed"
    ? "Destroyed"
    : item.targetWoundsAfter == null ? `${item.totalDamage ?? 0} damage` : `${item.totalDamage ?? 0} damage · ${item.targetWoundsAfter} wounds`;
  return `<li><strong>${escapeHtml(attacker?.name ?? item.attackerId)} → ${escapeHtml(target?.name ?? item.targetId)}</strong><span>${escapeHtml(weapon?.name ?? item.weaponId ?? "Weapon")} · ${escapeHtml(result)}</span></li>`;
}

export function createShootingScreen(container, {
  session,
  perspectivePlayerId = null,
  gameData = null
} = {}) {
  if (!container || typeof container.replaceChildren !== "function") throw new TypeError("A browser container element is required.");
  if (!session || typeof session.getState !== "function" || typeof session.subscribe !== "function") throw new TypeError("A game session is required.");

  let selectedAttackerId = null;
  let selectedWeaponId = null;
  let selectedTargetId = null;

  function render() {
    const state = session.getState();
    const model = getShootingViewModel(state, { perspectivePlayerId });
    const weapons = getShootingWeaponOptions(state, { attackerId: selectedAttackerId, gameData });
    const targets = getShootingTargetOptions(state, { attackerId: selectedAttackerId, perspectivePlayerId });

    if (!model.activations.some((activation) => activation.unitId === selectedAttackerId)) {
      selectedAttackerId = null; selectedWeaponId = null; selectedTargetId = null;
    }
    if (!weapons.some((weapon) => weapon.id === selectedWeaponId)) selectedWeaponId = null;
    if (!targets.some((target) => target.unitId === selectedTargetId)) selectedTargetId = null;

    container.innerHTML = `<main class="shoot-screen">
      <header><div><div class="kicker">LIVE BATTLE</div><h1>Shooting Phase</h1><p>Round ${escapeHtml(model.round)} · Turn ${escapeHtml(model.turn)}</p></div>
      <strong>${model.canComplete ? "All Shooting activations recorded" : "Select the next unit that shoots"}</strong></header>
      <p class="note">Select only the units that actually shoot. The app records the activation and uses the existing combat resolver for ranged attacks; range, visibility, modifiers and dice remain table-side decisions.</p>
      <section><div class="heading"><h2>Eligible units</h2><span>${model.candidates.length} remaining</span></div>
        <div class="candidates">${model.candidates.length ? model.candidates.map(unitButton).join("") : "<p>None</p>"}</div>
      </section>
      <div class="grid">
        <section><div class="heading"><h2>Ranged attack</h2><span>Minimal entry</span></div>
          <div class="controls">
            <label>Shooter<select data-shooter><option value="">Select shooter</option>${model.activations.map((unit) => `<option value="${escapeHtml(unit.unitId)}" ${unit.unitId === selectedAttackerId ? "selected" : ""}>${escapeHtml(unit.unit.name)} · ${escapeHtml(ownerLabel(unit.unit))}</option>`).join("")}</select></label>
            <label>Weapon<select data-weapon ${selectedAttackerId ? "" : "disabled"}><option value="">Select ranged weapon</option>${weapons.map((weapon) => `<option value="${escapeHtml(weapon.id)}" ${weapon.id === selectedWeaponId ? "selected" : ""}>${escapeHtml(weapon.name)}</option>`).join("")}</select></label>
            <label>Target<select data-target ${selectedAttackerId ? "" : "disabled"}><option value="">Select enemy target</option>${targets.map((target) => `<option value="${escapeHtml(target.unitId)}" ${target.unitId === selectedTargetId ? "selected" : ""}>${escapeHtml(target.name)} · ${escapeHtml(ownerLabel(target))}</option>`).join("")}</select></label>
            <button type="button" data-attack ${selectedAttackerId && selectedWeaponId && selectedTargetId ? "" : "disabled"}>Resolve Attack</button>
          </div>
        </section>
        <section><div class="heading"><h2>Shooting history</h2><span>${model.activations.length} activated</span></div>
          <ol class="history">${model.activations.length ? model.activations.map((item,index) => `<li><strong>${index+1}. ${escapeHtml(item.unit.name)}</strong><span>${escapeHtml(ownerLabel(item.unit))}</span></li>`).join("") : "<li>No units selected yet.</li>"}</ol>
        </section>
        <section><div class="heading"><h2>Attack results</h2><span>${model.attacks.length} recorded</span></div>
          <ol class="history">${model.attacks.length ? model.attacks.map((item) => historyRow(item,state,gameData)).join("") : "<li>No attacks recorded yet.</li>"}</ol>
        </section>
      </div>
      <footer><button class="complete" type="button" data-complete ${model.canComplete ? "" : "disabled"}>End Shooting Phase</button></footer>
    </main>`;

    container.querySelectorAll("[data-shoot-unit]").forEach((button) => button.addEventListener("click", () => {
      activateShootingUnit(session, { unitId: button.getAttribute("data-shoot-unit") });
    }));
    container.querySelector("[data-shooter]")?.addEventListener("change", (event) => {
      selectedAttackerId = event.target.value || null; selectedWeaponId = null; selectedTargetId = null; render();
    });
    container.querySelector("[data-weapon]")?.addEventListener("change", (event) => { selectedWeaponId = event.target.value || null; render(); });
    container.querySelector("[data-target]")?.addEventListener("change", (event) => { selectedTargetId = event.target.value || null; render(); });
    container.querySelector("[data-attack]")?.addEventListener("click", () => {
      const weapon = weapons.find((item) => item.id === selectedWeaponId);
      if (!weapon) return;
      resolveShootingAttack(session, { attackerId: selectedAttackerId, targetId: selectedTargetId, weapon });
      selectedWeaponId = null; selectedTargetId = null; render();
    });
    container.querySelector("[data-complete]")?.addEventListener("click", () => finishShootingPhase(session));
    return model;
  }

  const unsubscribe = session.subscribe(render);
  render();
  return { getState: () => session.getState(), render, destroy: () => { unsubscribe(); container.replaceChildren(); } };
}
