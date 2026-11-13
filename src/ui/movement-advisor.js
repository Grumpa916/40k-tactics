import { getCombatFormationRoot } from "../rules/battle-unit-reference.js";
import { getMovementStrategicRecommendations } from "../rules/tactical-movement-router.js";
import { getPrimaryStrategyContext } from "../rules/tactical-primary-strategy-router.js";
import { liveMapObjectiveLabel, objectivePickerLabel } from '../rules/objective-display-labels.js';
import { getOpponentTurnDefensiveContext, isOpponentTurnFor } from "../rules/tactical-opponent-turn.js";
import { getSecondaryMissionIntelligence } from "../rules/secondary-mission-intelligence.js";

let highlightEventsBound = false;
let activeHighlight = null;

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function priorityLabel(priority) {
  if (priority >= 5) return "very high";
  if (priority >= 4) return "high";
  if (priority >= 3) return "medium";
  if (priority >= 2) return "low";
  return "minimal";
}

function purposeLabel(purpose) {
  return String(purpose ?? "reposition").replaceAll("-", " ");
}

function destinationLabel(option, state, perspectivePlayerId) {
  if (option?.objectiveId) {
    return `Objective · ${liveMapObjectiveLabel(state, option.objectiveId, perspectivePlayerId)}`;
  }
  if (option?.locationLabel) return `Mission position · ${option.locationLabel}`;
  if (option?.targetName) return `Enemy · ${option.targetName}`;
  if (option?.territoryTarget === "boundary") return "Territory · Boundary";
  if (option?.territoryTarget === "opponent") return "Territory · Opponent";
  return "Flexible board position";
}

function strategicFitLabel(score) {
  const value = Number(score);
  if (!Number.isFinite(value)) return "—";
  return `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%`;
}

function highlightDescriptor(option) {
  if (option?.objectiveId) return { kind: "objective", id: option.objectiveId };
  if (option?.targetUnitId) return { kind: "unit", id: option.targetUnitId };
  return { kind: "none", id: "" };
}

function renderMovementOption(option, index, selectedRank, state, perspectivePlayerId) {
  const recommended = index === 0;
  const rank = index + 1;
  const descriptor = highlightDescriptor(option);
  const selected = selectedRank === rank;
  return `<a href="#movement-destination-${rank}" role="button" class="move-unit movement-advisor__option${selected ? " is-selected" : ""}" data-movement-option-rank="${rank}" data-movement-highlight-kind="${escapeHtml(descriptor.kind)}" data-movement-highlight-id="${escapeHtml(descriptor.id)}" aria-pressed="${selected}">
    <strong>${rank}. ${escapeHtml(destinationLabel(option, state, perspectivePlayerId))}${recommended ? " · Recommended" : ""}</strong>
    <span>${escapeHtml(purposeLabel(option.purpose))} · ${escapeHtml(strategicFitLabel(option.score))} relative fit</span>
    <small>${escapeHtml(option.actionHint ?? "Reposition for this strategic purpose")}</small>
    ${option.reason ? `<small>${escapeHtml(option.reason)}</small>` : ""}
  </a>`;
}

function mapRootForAdvisor(aside) {
  return aside?.closest?.(".combat-workspace") ?? aside?.closest?.("main.movement-screen") ?? aside?.parentElement ?? null;
}

function clearHighlight(root) {
  if (!root?.querySelectorAll) return;
  for (const element of root.querySelectorAll(".is-advisor-highlight")) {
    element.classList.remove("is-advisor-highlight");
    element.removeAttribute("aria-current");
  }
}

function findHighlightTarget(root, kind, id) {
  if (!root?.querySelectorAll || !id) return null;
  const attribute = kind === "objective" ? "data-map-objective-id" : kind === "unit" ? "data-map-unit-id" : null;
  if (!attribute) return null;
  return [...root.querySelectorAll(`[${attribute}]`)].find((element) => element.getAttribute(attribute) === id) ?? null;
}

function applyActiveHighlight(aside) {
  if (!aside) return;
  const root = mapRootForAdvisor(aside);
  clearHighlight(root);
  for (const option of aside.querySelectorAll?.("[data-movement-option-rank]") ?? []) {
    const selected = Boolean(activeHighlight && activeHighlight.unitId === aside.getAttribute("data-movement-advisor-unit-id") && Number(option.getAttribute("data-movement-option-rank")) === activeHighlight.rank);
    option.classList.toggle("is-selected", selected);
    option.setAttribute("aria-pressed", String(selected));
  }
  if (!activeHighlight || activeHighlight.unitId !== aside.getAttribute("data-movement-advisor-unit-id")) return;
  const target = findHighlightTarget(root, activeHighlight.kind, activeHighlight.id);
  if (!target) return;
  target.classList.add("is-advisor-highlight");
  target.setAttribute("aria-current", "true");
}

function activateHighlightOption(option) {
  const aside = option?.closest?.("[data-movement-advisor]");
  if (!aside) return;
  activeHighlight = {
    unitId: aside.getAttribute("data-movement-advisor-unit-id"),
    rank: Number(option.getAttribute("data-movement-option-rank")),
    kind: option.getAttribute("data-movement-highlight-kind") ?? "none",
    id: option.getAttribute("data-movement-highlight-id") ?? ""
  };
  applyActiveHighlight(aside);
}

function bindHighlightEvents() {
  if (highlightEventsBound || typeof document === "undefined") return;
  highlightEventsBound = true;
  document.addEventListener("click", (event) => {
    const option = event.target?.closest?.("[data-movement-highlight-kind]");
    if (!option) return;
    event.preventDefault();
    activateHighlightOption(option);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== " ") return;
    const option = event.target?.closest?.("[data-movement-highlight-kind]");
    if (!option) return;
    event.preventDefault();
    activateHighlightOption(option);
  });
}

function scheduleHighlightRestore(unitId) {
  if (typeof document === "undefined" || typeof queueMicrotask !== "function") return;
  queueMicrotask(() => {
    const aside = [...document.querySelectorAll?.("[data-movement-advisor]") ?? []]
      .find((element) => element.getAttribute("data-movement-advisor-unit-id") === unitId);
    if (aside) applyActiveHighlight(aside);
  });
}

function renderOpponentMovementDefence(state, playerId) {
  const context = getOpponentTurnDefensiveContext(state, { playerId });
  const secondaryDue=getSecondaryMissionIntelligence(state,{playerId})
    .filter(card=>card.eligibleNow && card.scoringWindows.some(window=>window.timing==='end-of-opponent-turn'));
  const threats = context.threats.map(item => `<li><strong>${escapeHtml(item.unitName)}</strong> · ${escapeHtml(item.reason)}
    ${item.nearestEnemy ? `<small>Nearby: ${escapeHtml(item.nearestEnemy.enemyName)} · about ${escapeHtml(item.nearestEnemy.distance)}″ on map</small>` : ''}
    ${item.attacksReceived ? `<small>${escapeHtml(item.attacksReceived)} incoming attack(s) recorded · ${escapeHtml(item.damageTakenThisTurn)} damage this turn</small>` : ''}
    ${item.battleShocked ? '<small>Battle-shocked · confirm defensive eligibility</small>' : ''}</li>`).join('');
  const windows = context.windows.map(item => `<li><strong>${escapeHtml(item.name)}</strong>
    ${item.unitName ? `· ${escapeHtml(item.unitName)}` : ''}
    <small>${escapeHtml(item.timing ?? 'Confirm timing at tabletop')}</small></li>`).join('');

  return `<aside class="movement-advisor" data-opponent-defensive-advisor>
    <div class="move-heading"><h2>Opponent turn · Defensive Advisor</h2><span>Protect your army</span></div>
    <p>Record the opponent's movement on the map. Review your units under threat; the opponent's movement destinations and offensive targets are not recommendations for you.</p>
    <details open><summary>Defensive priorities · ${context.threats.length}</summary>
      ${threats ? `<ol>${threats}</ol>` : '<p>No close enemy threats or new attacks are established from recorded data. Check the physical tabletop for untracked threats.</p>'}
    </details>
    ${windows ? `<details open><summary>Current defensive rule windows · ${context.windows.length}</summary><ul>${windows}</ul><small>References only; confirm triggers, targets, timing and CP on the tabletop before using an ability or Stratagem.</small></details>` : ''}
    ${secondaryDue.length?`<details data-secondary-opponent-turn-intelligence open><summary>Secondary opponent-turn checkpoints · ${secondaryDue.length}</summary>
      <ul>${secondaryDue.map(card=>`<li><strong>${escapeHtml(card.name)}</strong><small>${escapeHtml(card.advice)} Confirm the printed conditions and VP at the actual checkpoint.</small></li>`).join('')}</ul>
    </details>`:''}
    <details class="movement-advisor__limitations" data-view-key="opponent-movement-estimate-limitations"><summary>Estimate limitations</summary>
      <small>Incoming damage estimates appear in Shooting and Fight once an attacker, weapon and target are selected. Map proximity alone does not establish legal attacks or charges.</small>
    </details>
  </aside>`;
}

export function renderMovementAdvisor(state, { playerId, selectedUnitId = null, perspectivePlayerId = playerId } = {}) {
  if (!playerId || state?.phase !== "movement") return "";
  if (isOpponentTurnFor(state, perspectivePlayerId)) return renderOpponentMovementDefence(state, perspectivePlayerId);

  let context;
  try {
    context = getMovementStrategicRecommendations(state, { playerId, perspectivePlayerId });
  } catch {
    return `<aside class="movement-advisor"><h2>Movement Advisor</h2><p>Strategic movement context is unavailable for the current battle state.</p></aside>`;
  }

  let primaryStrategy = null;
  try {
    primaryStrategy = getPrimaryStrategyContext(state, { playerId, perspectivePlayerId });
  } catch {
    primaryStrategy = null;
  }

  const selectedUnit = (state.units ?? []).find((unit) => unit.id === selectedUnitId) ?? null;
  const selectedRootId = getCombatFormationRoot(state, selectedUnit)?.id ?? selectedUnitId;
  const selected = context.recommendations.find((item) => item.unitId === selectedRootId) ?? context.recommendations[0] ?? null;
  if (!selected) {
    return `<aside class="movement-advisor"><h2>Movement Advisor</h2><p>No deployed formation has a strategic movement recommendation.</p></aside>`;
  }

  if (activeHighlight?.unitId && activeHighlight.unitId !== selected.unitId) activeHighlight = null;
  bindHighlightEvents();
  scheduleHighlightRestore(selected.unitId);

  const activeMissionText = context.activeSecondaries.length
    ? context.activeSecondaries.map((mission) => `${mission.name}${mission.verified ? "" : " (review only)"}`).join(" · ")
    : "No active secondary cards recorded";
  const territoryVerifiedText = context.territorySignal?.missions?.length
    ? `Verified territory ranking: ${context.territorySignal.missions.join(", ")}.`
    : "No verified active secondary currently adds territory-ranking value.";
  const territoryReviewText = context.territorySignal?.reviewOnlyMissions?.length
    ? `Review-only territory context: ${context.territorySignal.reviewOnlyMissions.join(", ")}. These cards do not change the numeric ranking until verified.`
    : "";
  const secondaryPlans=context.secondaryPlans??[];
  const secondaryPlanningText=secondaryPlans.length
    ? '<ul>'+secondaryPlans.map(card => {
        const timing=card.timingLabels.length ? card.timingLabels.join(' / ') : 'Confirm scoring window';
        const blockers=card.choicePending?' Required When Drawn choice not yet recorded.':'';
        const target=card.selectedObjectiveId?` Recorded target: ${objectivePickerLabel(state,card.selectedObjectiveId,perspectivePlayerId)}.`:'';
        const action=card.action?` ${card.action}; scoring remains manual.`:'';
        const guard=card.guarding?.length?` Guard assignments: ${card.guarding.map(assignment=>`${objectivePickerLabel(state,assignment.objectiveId,perspectivePlayerId)} — ${(state.units??[]).find(unit=>unit.id===assignment.unitId)?.name??assignment.unitId}`).join('; ')}.`:'';
        return `<li><strong>${escapeHtml(card.name)}</strong> · ${escapeHtml(timing)}<small class="movement-advisor__secondary-advice">${escapeHtml(card.advice+target+blockers+action+guard)}</small></li>`;
      }).join('')+'</ul>'
    : '<p>No active Secondary mission cards recorded.</p>';
  const priorities = context.recommendations;
  const selectedOptions = [selected, ...(selected.alternatives ?? [])].slice(0, 3);
  const selectedRank = activeHighlight?.unitId === selected.unitId ? activeHighlight.rank : null;

  return `<aside class="movement-advisor" data-movement-advisor data-movement-advisor-unit-id="${escapeHtml(selected.unitId)}">
    <style>
      [data-movement-advisor] .movement-advisor__option{color:inherit;text-decoration:none}
      [data-movement-advisor] .movement-advisor__secondary-advice{display:block;margin-top:4px;line-height:1.4}
      [data-movement-advisor] .movement-advisor__option.is-selected{outline:2px solid #f6d783;outline-offset:1px}
      .movement-advisor__limitations{margin-top:8px;border-top:1px solid #53665a;padding-top:4px}
      .movement-advisor__limitations>summary{min-height:36px;padding:8px;cursor:pointer}
      .movement-advisor__limitations>small{display:block;padding:0 8px 9px;line-height:1.4}
      .battlefield-map__unit.is-advisor-highlight,.battlefield-map__objective.is-advisor-highlight{outline:4px solid #f6d783!important;outline-offset:3px;z-index:9;box-shadow:0 0 0 4px rgba(246,215,131,.28),0 1px 7px #000c!important}
    </style>
    <div class="move-heading">
      <h2>Movement Advisor</h2>
      <span>${escapeHtml(context.strategy.posture)} · ${escapeHtml(priorityLabel(selected.priority))} priority</span>
    </div>
    ${primaryStrategy?.active ? `<details open data-primary-strategy><summary><strong>Primary strategy · ${escapeHtml(primaryStrategy.missionName)}</strong></summary>
      <p>${escapeHtml(primaryStrategy.reason)}</p>
      <ul>${(primaryStrategy.summary ?? []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
    </details>` : ""}
    <p><strong>${escapeHtml(selected.recommendation)}</strong></p>
    <div class="fight-advisory__grid movement-advisor__grid">
      <div><strong>${selected.movement == null ? "—" : `${escapeHtml(selected.movement)}\"`}</strong><span>saved Move</span></div>
      <div><strong>${selected.effectiveOc == null ? "—" : escapeHtml(selected.effectiveOc)}</strong><span>usable OC</span></div>
      <div><strong>${escapeHtml(purposeLabel(selected.purpose))}</strong><span>purpose</span></div>
      <div><strong>${escapeHtml(selected.confidence)}</strong><span>confidence</span></div>
    </div>
    <p>${escapeHtml(selected.actionHint)}</p>
    <details open>
      <summary>Possible destinations · ${selectedOptions.length}</summary>
      <div class="move-units movement-advisor__options">${selectedOptions.map((option, index) => renderMovementOption(option, index, selectedRank, state, perspectivePlayerId)).join("")}</div>
      <p><small>Tap an objective or enemy option to highlight it. Territory options use the dotted boundary already shown on the map. Highlight only — the unit is not moved and no movement choice is recorded.</small></p>
    </details>
    <details>
      <summary>Why this move?</summary>
      <p>${escapeHtml(selected.reason)}</p>
      <p><small>${escapeHtml(context.strategy.reason)}</small></p>
    </details>
    <details>
      <summary>Move priorities · ${context.recommendations.length}</summary>
      <div class="move-units">${priorities.map((item, index) => `<button type="button" class="move-unit${item.unitId === selected.unitId ? " is-selected" : ""}" data-move-unit="${escapeHtml(item.unitId)}">
        <strong>${index + 1}. ${escapeHtml(item.unitName)}</strong>
        <span>${escapeHtml(purposeLabel(item.purpose))}</span>
        <small>${escapeHtml(item.recommendation)}</small>
      </button>`).join("")}</div>
    </details>
    <details>
      <summary>Mission context</summary>
      ${primaryStrategy?.active ? `<p><strong>${escapeHtml(primaryStrategy.missionName)}</strong> · ${escapeHtml(primaryStrategy.summary?.[0] ?? primaryStrategy.reason)}</p>` : ""}
      <p>${escapeHtml(activeMissionText)}</p>
      <div data-secondary-mission-intelligence>${secondaryPlanningText}</div>
      <small>${escapeHtml(territoryVerifiedText)}</small>
      ${territoryReviewText ? `<br><small>${escapeHtml(territoryReviewText)}</small>` : ""}
      <br><small>Only verified mission text changes movement ranking. Review-only cards remain visible but are not silently scored.</small>
    </details>
    <details class="movement-advisor__limitations" data-view-key="movement-estimate-limitations">
      <summary>Estimate limitations</summary>
      <small>Map distances are approximate; territory classifications are advisory, and positions within ±3\" of the dotted line remain uncertain. Relative fit is not a movement-success probability. Destination options describe strategic purposes, not exact legal endpoints. The tabletop, mission rules and actual OC determine movement and scoring.</small>
    </details>
  </aside>`;
}

