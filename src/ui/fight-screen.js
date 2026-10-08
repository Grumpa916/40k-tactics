import {
  getFightViewModel,
  recordFightActivation,
  completeFightPhase
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
  return unit?.side === "self" ? "You" : unit?.side === "opponent" ? "Opponent" : unit?.ownerName ?? "Unknown";
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
  { state, perspectivePlayerId = null, onStateChange = null } = {}
) {
  if (!container || typeof container.replaceChildren !== "function") {
    throw new TypeError("A browser container element is required.");
  }

  let currentState = state;

  function render() {
    const model = getFightViewModel(currentState, { perspectivePlayerId });
    const hasFirst = model.candidates.fightsFirst.length > 0;

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

        <footer class="fight-footer">
          <button class="fight-complete" type="button" data-fight-complete ${model.canComplete ? "" : "disabled"}>
            End Fight Phase
          </button>
        </footer>
      </main>
    `;

    container.querySelectorAll("[data-fight-unit]").forEach((button) => {
      button.addEventListener("click", () => {
        const unitId = button.getAttribute("data-fight-unit");
        currentState = recordFightActivation(currentState, { unitId });
        onStateChange?.(currentState);
        render();
      });
    });

    const complete = container.querySelector("[data-fight-complete]");
    complete?.addEventListener("click", () => {
      currentState = completeFightPhase(currentState);
      onStateChange?.(currentState);
      render();
    });

    return model;
  }

  render();

  return {
    getState: () => currentState,
    render,
    destroy: () => container.replaceChildren()
  };
}
