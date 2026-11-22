import { COMPLETE_SECONDARY_MISSION_CATALOG } from "../data/secondary-mission-complete-catalog.js";

const STORAGE_KEY = "40k-tactics-secondary-hand";

function escapeHtml(value) {
  const entities = { "&": "amp", "<": "lt", ">": "gt", '"': "quot", "'": "#039" };
  return String(value ?? "").replace(/[&<>"']/g, (char) => "&" + entities[char] + ";");
}

function loadHeld() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function createSecondaryPlannerState() {
  return { open: false, filter: "all", query: "", held: loadHeld(), view: "list" };
}

function timingText(mission) {
  return mission.scoringWindows.map((window) => `${window.timing} ${window.timingLabel}`).join(" ").toLowerCase();
}

export function secondaryWhen(mission) {
  const text = timingText(mission);
  const yourTurn = text.includes("your turn");
  const opponentTurn = text.includes("opponent");
  if (text.includes("either") || (yourTurn && opponentTurn)) return "either";
  if (opponentTurn) return "opponent";
  return "your-turn";
}

function whenLabel(when) {
  if (when === "opponent") return "End of his turn";
  if (when === "either") return "Either turn";
  return "End of your turn";
}

function displayWindows(mission) {
  const seen = new Set();
  return mission.scoringWindows.filter((window) => {
    const key = `${window.modes.join(",")}|${window.tiers.map((tier) => `${tier.vp}|${tier.summary ?? ""}`).join("||")}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function matches(mission, state) {
  const when = secondaryWhen(mission);
  if (state.filter === "your-turn" && when !== "your-turn") return false;
  if (state.filter === "opponent" && when !== "opponent") return false;
  if (state.filter === "either" && when !== "either") return false;
  if (state.filter === "action" && !mission.missionAction) return false;
  if (state.filter === "fixed" && !mission.fixedAvailable) return false;
  const query = state.query.trim().toLowerCase();
  if (!query) return true;
  return `${mission.name} ${mission.whenDrawn ?? ""} ${mission.missionAction?.summary ?? ""}`.toLowerCase().includes(query);
}

function tierLine(tier) {
  const cap = tier.maxVP ? `, maximum ${tier.maxVP}` : "";
  const relate = tier.relationship === "or" ? "Take this or the other tier, not both. " : tier.relationship === "cumulative" ? "Adds to the other amount. " : "";
  return `<li><strong>${escapeHtml(tier.vp)} VP${escapeHtml(cap)}</strong> ${escapeHtml(relate)}${escapeHtml(tier.summary ?? "")}</li>`;
}

function windowBlock(window) {
  const modes = window.modes?.includes("fixed") && window.modes?.includes("tactical")
    ? "Fixed and Tactical"
    : window.modes?.includes("fixed") ? "Fixed" : "Tactical";
  const extra = [
    window.minRound ? `From round ${window.minRound}.` : "",
    window.endOfFifthRoundAlternative ? "Or at the end of round 5 if that comes first." : ""
  ].filter(Boolean).join(" ");
  return `<section class="secondary-planner__window"><p><span>${escapeHtml(modes)}</span> ${escapeHtml(window.timingLabel)}</p>${extra ? `<p>${escapeHtml(extra)}</p>` : ""}<ul>${window.tiers.map(tierLine).join("")}</ul></section>`;
}

function cardMarkup(mission, held) {
  const when = secondaryWhen(mission);
  const notes = [...(mission.referenceNotes ?? []), ...(mission.notes ?? [])];
  const windows = displayWindows(mission);
  const timings = windows.map((window) => window.timingLabel).filter((label, index, all) => all.indexOf(label) === index).join(" · ");
  return `<article class="secondary-planner__card${held ? " is-held" : ""}" data-secondary-card="${escapeHtml(mission.id)}">
    <header><div><h3>${escapeHtml(mission.name)}</h3><p class="secondary-planner__when" data-when="${when}">${escapeHtml(timings)}</p></div>
    <button type="button" data-secondary-hold="${escapeHtml(mission.id)}" aria-pressed="${String(held)}">${held ? "In hand" : "Mark"}</button></header>
    <p class="secondary-planner__tags">${mission.fixedAvailable ? "Fixed or Tactical" : "Tactical only"}${mission.missionAction ? " · Action" : ""}</p>
    ${mission.missionAction ? `<p>${escapeHtml(mission.missionAction.summary)}</p>` : ""}
    ${windows.map(windowBlock).join("")}
    ${mission.whenDrawn ? `<p class="secondary-planner__draw">When drawn: ${escapeHtml(mission.whenDrawn)}</p>` : ""}
    ${notes.map((note) => `<p class="secondary-planner__note">${escapeHtml(note)}</p>`).join("")}
  </article>`;
}

function handGroup(missions, when) {
  const cards = missions.filter((mission) => secondaryWhen(mission) === when);
  return `<div><p>${whenLabel(when)}</p>${cards.length ? `<ul>${cards.map((mission) => `<li><button type="button" data-secondary-hold="${escapeHtml(mission.id)}">${escapeHtml(mission.name)}</button></li>`).join("")}</ul>` : "<p>None</p>"}</div>`;
}

function renderSecondaryMap(heldIds) {
  const active = new Set(heldIds ?? []);
  function place(id, name, ...notes) {
    return `<li class="${active.has(id) ? "is-active" : ""}"><strong>${escapeHtml(name)}</strong>${notes.map((note) => `<span>${escapeHtml(note)}</span>`).join("")}</li>`;
  }
  return `<div class="secondary-map" data-secondary-map>
    <p class="secondary-planner__lead">Sample table, you at the bottom. Your territory is your deployment zone plus the near half of No Man's Land. His territory is the other half. The printed card still wins.</p>
    <section class="secondary-map__zone secondary-map__opp"><h3>His deployment zone</h3><p>The area he deployed in. This is also inside his territory.</p><ul>
      ${place("secondary-behind-enemy-lines", "Behind Enemy Lines", "Unit wholly inside this zone 3 VP each, max of 5 VP")}
      ${place("secondary-forward-position", "Forward Position 5VP", "Opponent's home and/or both expansions")}
    </ul></section>
    <section class="secondary-map__zone secondary-map__opp-territory"><h3>His territory</h3><p>His deployment zone and the far half of No Man's Land, past the centre line.</p><ul>
      ${place("secondary-beacon", "Beacon", "The beacon is on the table and not in your deployment zone, 3 VP. Beacon outside of your territory, 5 VP.")}
      ${place("secondary-plunder", "Plunder 5VP", "The terrain area, not just the unit, must be outside your territory.")}
      ${place("secondary-outflank", "Outflank", "Within 6 inches of an edge, and that unit is not in your territory 3VP", "2 units and opposite edges 5VP")}
    </ul></section>
    <p class="secondary-map__center">Centre line. Your territory is below. His territory is above.</p>
    <section class="secondary-map__zone secondary-map__nml"><h3>No Man's Land</h3><p>Everything outside both deployment zones. The near half is still your territory.</p><ul>
      ${place("secondary-display-of-might", "Display of Might", "More of your units than his, wholly in this band.", "End of my turn 2VP, end of opponents turn 5VP")}
      ${place("secondary-secure-no-mans-land", "Secure No Man's Land 5VP", "Control two or more objectives here. Your home does not count.")}
      ${place("secondary-a-tempting-target", "A Tempting Target 5VP", "The one No Man's Land objective he chose.")}
      ${place("secondary-centre-ground", "Centre Ground", "3 inches of center and no enemies within 6 inches 5VP")}
      ${place("secondary-forward-position", "Forward Position 5VP", "Opponent's home and/or both expansions")}
    </ul></section>
    <section class="secondary-map__zone secondary-map__mine"><h3>Your deployment zone</h3><p>Where you deployed. This is inside your territory.</p><ul>
      ${place("secondary-defend-stronghold", "Defend Stronghold", "Control your home 3VP. Add 2 if no enemy unit is in this zone.")}
    </ul></section>
    <section class="secondary-map__zone secondary-map__any"><h3>Place does not matter</h3><p>These score from the action, not from standing in one zone.</p><ul>
      ${place("secondary-assassination", "Assassination 5VP", "Destroy an enemy Character.")}
      ${place("secondary-bring-it-down", "Bring it Down 5VP", "Destroy an enemy model with 10 or more Wounds.")}
      ${place("secondary-a-grievous-blow", "A Grievous Blow 5VP", "Destroy an enemy unit with starting strength 13 or more.")}
      ${place("secondary-no-prisoners", "No Prisoners", "Destroy enemy units. 2 points each, max of 5")}
      ${place("secondary-overwhelming-force", "Overwhelming Force", "Destroy enemy off of an objective")}
      ${place("secondary-burden-of-trust", "Burden of Trust", "Whichever objectives you assigned a guard to.")}
      ${place("secondary-cleanse", "Cleanse", "One objective 2 VP, two objectives 5 VP. Any objective except your home.")}
    </ul></section>
    <section class="secondary-map__zone secondary-map__quarters${active.has("secondary-engage-on-all-fronts") ? " is-active" : ""}"><h3>Engage on All Fronts</h3><p>The table is split into four quarters, not into deployment zones. A quarter counts only if one of your units is wholly inside it and more than 6 inches from the centre. Aircraft and Battle-shocked units do not count. Score at the end of your turn. Take one result: Tactical is 3 VP for three quarters or 5 VP for four. Fixed is 2 or 4.</p>
      <div class="secondary-map__grid" aria-label="Four table quarters, you at the bottom">
        <div>His left quarter</div><div>His right quarter</div>
        <div class="secondary-map__dead">Within 6 inches of the centre does not count for any quarter</div>
        <div>Your left quarter</div><div>Your right quarter</div>
      </div>
    </section>
  </div>`;
}

export function renderSecondaryPlanner(state) {
  const view = state.view === "map" ? "map" : "list";
  const shown = COMPLETE_SECONDARY_MISSION_CATALOG.filter((mission) => matches(mission, state))
    .sort((left, right) => {
      const leftHeld = state.held.includes(left.id);
      const rightHeld = state.held.includes(right.id);
      if (leftHeld !== rightHeld) return leftHeld ? -1 : 1;
      return left.name.localeCompare(right.name);
    });
  const held = COMPLETE_SECONDARY_MISSION_CATALOG.filter((mission) => state.held.includes(mission.id));
  const filters = [
    ["all", "All 18"],
    ["your-turn", "Your turn"],
    ["opponent", "His turn"],
    ["either", "Either turn"],
    ["action", "Action"],
    ["fixed", "Fixed"]
  ];
  const listBody = `<div class="secondary-planner__hand">${held.length ? handGroup(held, "your-turn") + handGroup(held, "opponent") + handGroup(held, "either") : `<p>${state.linked ? "No active Command phase cards. Tap Mark to add one to your hand." : "No cards marked. Tap Mark to sort this hand by when it scores."}</p>`}</div>
      <input class="secondary-planner__search" data-secondary-planner-search value="${escapeHtml(state.query)}" placeholder="Search a card" aria-label="Search secondaries">
      <div class="secondary-planner__filters">${filters.map(([id, label]) => `<button type="button" data-secondary-filter="${id}" aria-pressed="${String(state.filter === id)}">${label}</button>`).join("")}</div>
      <p class="secondary-planner__lead">${shown.length} cards</p>
      <div class="secondary-planner__list">${shown.map((mission) => cardMarkup(mission, state.held.includes(mission.id))).join("")}</div>`;
  return `<div class="secondary-planner" data-secondary-planner${state.open ? "" : " hidden"}>
    <style>
      .battle-shell__cards-button,[data-toggle-secondary-planner].prototype-cards-button{min-height:44px;padding:8px 12px;border:1px solid #7d6a98;border-radius:8px;background:#2a2236;color:#f4efe6;font:inherit;font-weight:700;cursor:pointer}
      .secondary-planner{position:fixed;inset:0;z-index:1300;box-sizing:border-box;display:grid;grid-template-rows:minmax(0,1fr);place-items:center;padding:max(64px, calc(env(safe-area-inset-top) + 44px)) 12px max(12px, env(safe-area-inset-bottom));background:rgba(0,0,0,.78)}
      .secondary-planner[hidden]{display:none}
      .secondary-planner__dialog{box-sizing:border-box;display:flex;flex-direction:column;width:min(820px,100%);height:100%;max-height:100%;overflow:hidden;padding:14px;border:1px solid #697386;border-radius:12px;background:#151a22;color:#f2f4f8}
      .secondary-planner__heading,.secondary-planner__lead,.secondary-planner__notice,.secondary-planner__hand,.secondary-planner__search,.secondary-planner__filters{flex:none}
      .secondary-planner__heading{display:flex;align-items:center;justify-content:space-between;gap:12px}
      .secondary-planner__heading h2{margin:0;font-size:22px}
      .secondary-planner__heading-actions{display:flex;gap:8px}
      .secondary-planner__heading button,.secondary-planner__filters button,.secondary-planner__card header button,.secondary-planner__hand button{box-sizing:border-box;height:auto;min-height:44px;padding:8px 12px;border:1px solid #697386;border-radius:8px;background:#2a3340;color:inherit;font:inherit;line-height:1.2;white-space:nowrap;cursor:pointer}
      .secondary-planner__filters button[aria-pressed=true],.secondary-planner__card header button[aria-pressed=true],.secondary-planner__heading button[aria-pressed=true]{background:#c5ef9f;color:#14200f;border-color:#c5ef9f}
      .secondary-planner__lead{margin:6px 0 10px;color:#b7c0cc;font-size:14px}
      .secondary-planner__notice{flex:none;margin:0 0 10px;color:#ffd9a0;font-size:14px}
      .secondary-planner__hand{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-bottom:10px;padding:10px;border:1px solid #3c4553;border-radius:8px;background:#10151c}
      .secondary-planner__hand p{margin:0 0 6px;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#9aa6b5}
      .secondary-planner__hand ul{list-style:none;margin:0;padding:0;display:grid;gap:6px}
      .secondary-planner__hand button{width:100%;text-align:left;white-space:normal}
      .secondary-planner__search{box-sizing:border-box;width:100%;min-height:44px;margin-bottom:8px;padding:8px 10px;border:1px solid #697386;border-radius:8px;background:#10151c;color:inherit;font:inherit}
      .secondary-planner__filters{display:flex;flex-wrap:wrap;gap:6px;overflow:visible;margin-bottom:8px}
      .secondary-planner__filters button{flex:none}
      .secondary-planner__list,.secondary-map{flex:1;min-height:0;overflow:auto}
      .secondary-planner__list{display:grid;grid-template-columns:minmax(0,1fr);gap:8px;align-content:start}
      .secondary-planner__card{display:block;min-width:0;height:auto;padding:10px;border:1px solid #3c4553;border-radius:8px;background:#1b222d;overflow:visible}
      .secondary-planner__card.is-held{border-color:#c5ef9f}
      .secondary-planner__card header{display:flex;justify-content:space-between;align-items:flex-start;gap:8px}
      .secondary-planner__card h3{margin:0;font-size:18px}
      .secondary-planner__when{margin:4px 0 0;color:#d7c4ef;font-size:13px}
      .secondary-planner__tags,.secondary-planner__draw,.secondary-planner__note,.secondary-planner__card > p{margin:8px 0 0;color:#b7c0cc;font-size:13px;line-height:1.4;overflow-wrap:anywhere}
      .secondary-planner__window{margin-top:8px;padding:8px;border-radius:6px;background:#10151c}
      .secondary-planner__window p{margin:0 0 6px;font-size:13px;line-height:1.4;overflow-wrap:anywhere}
      .secondary-planner__window span{color:#c5ef9f;font-weight:700}
      .secondary-planner__window ul{margin:0;padding-left:18px;display:grid;gap:4px}
      .secondary-planner__window li{font-size:13px;line-height:1.4;overflow-wrap:anywhere}
      .secondary-map{display:grid;gap:8px;align-content:start}
      .secondary-map__zone{padding:10px;border:1px solid #3c4553;border-radius:8px}
      .secondary-map__zone h3{margin:0 0 4px;font-size:13px;letter-spacing:.08em;text-transform:uppercase}
      .secondary-map__zone p{margin:0 0 8px;color:#b7c0cc;font-size:13px}
      .secondary-map__zone ul{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:6px}
      .secondary-map__zone li{display:grid;gap:2px;max-width:100%;padding:8px;border-radius:6px;background:#10151c}
      .secondary-map__zone li.is-active{background:#9fd4ff;color:#102033}
      .secondary-map__zone li.is-active span{color:#1a4668}
      .secondary-map__quarters.is-active{background:#9fd4ff;color:#102033}
      .secondary-map__quarters.is-active p{color:#1a4668}
      .secondary-map__zone li span{color:#9aa6b5;font-size:12px}
      .secondary-map__opp{background:#3a2430}
      .secondary-map__opp-territory{background:#2c2436}
      .secondary-map__nml{background:#243028}
      .secondary-map__mine{background:#2a3324}
      .secondary-map__any{background:#1b222d}
      .secondary-map__quarters{background:#2a2a24}
      .secondary-map__grid{display:grid;grid-template-columns:1fr 1fr;gap:6px}
      .secondary-map__grid div{padding:10px;border-radius:6px;background:#10151c;text-align:center;font-size:13px;font-weight:700}
      .secondary-map__dead{grid-column:1 / -1;color:#d7c4ef;font-weight:600}
      .secondary-map__center{margin:0;text-align:center;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#d7c4ef}
      @media (max-width:760px){.secondary-planner{padding-left:8px;padding-right:8px}.secondary-planner__dialog{padding:10px}.secondary-planner__hand,.secondary-planner__list{grid-template-columns:minmax(0,1fr)}}
    </style>
    <section class="secondary-planner__dialog" role="dialog" aria-modal="true" aria-labelledby="secondary-planner-title">
      <header class="secondary-planner__heading"><h2 id="secondary-planner-title">Secondary planner</h2>
        <div class="secondary-planner__heading-actions">
          <button type="button" data-secondary-view="list" aria-pressed="${String(view === "list")}">Cards</button>
          <button type="button" data-secondary-view="map" aria-pressed="${String(view === "map")}">Map</button>
          <button type="button" data-close-secondary-planner>Close</button>
        </div>
      </header>
      <p class="secondary-planner__lead">${view === "map" ? "Where each secondary is completed on a sample battlefield." : state.linked ? "In hand is your active Command phase secondaries. Mark adds a card. In hand removes it." : "All 18 cards. Mark the ones in your hand. The printed card still wins if a line disagrees."}</p>
      ${state.notice ? `<p class="secondary-planner__notice" role="status">${escapeHtml(state.notice)}</p>` : ""}
      ${view === "map" ? renderSecondaryMap(state.held) : listBody}
    </section>
  </div>`;
}

export function bindSecondaryPlanner(container, state, { onHoldToggle } = {}) {
  function persist() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.held)); } catch { /* private mode */ }
  }
  function paint(focusSearch) {
    const current = container.querySelector?.("[data-secondary-planner]");
    if (current) current.outerHTML = renderSecondaryPlanner(state);
    container.querySelectorAll?.("[data-toggle-secondary-planner]").forEach((button) => {
      button.setAttribute("aria-expanded", String(state.open));
    });
    if (focusSearch) container.querySelector?.("[data-secondary-planner-search]")?.focus?.();
  }
  function onClick(event) {
    const toggle = event.target?.closest?.("[data-toggle-secondary-planner]");
    const close = event.target?.closest?.("[data-close-secondary-planner]");
    const overlay = container.querySelector?.("[data-secondary-planner]");
    const filter = event.target?.closest?.("[data-secondary-filter]");
    const hold = event.target?.closest?.("[data-secondary-hold]");
    const view = event.target?.closest?.("[data-secondary-view]");
    if (toggle) {
      event.preventDefault?.();
      state.open = !state.open;
      paint(false);
      return;
    }
    if (!overlay || overlay.hidden) return;
    if (view) {
      event.preventDefault?.();
      state.view = view.getAttribute("data-secondary-view") === "map" ? "map" : "list";
      paint(false);
      return;
    }
    if (close || event.target === overlay) {
      event.preventDefault?.();
      state.open = false;
      paint(false);
      return;
    }
    if (filter) {
      event.preventDefault?.();
      state.filter = filter.getAttribute("data-secondary-filter");
      paint(false);
      return;
    }
    if (hold) {
      event.preventDefault?.();
      const id = hold.getAttribute("data-secondary-hold");
      if (onHoldToggle) {
        onHoldToggle(id, !state.held.includes(id));
        return;
      }
      state.held = state.held.includes(id) ? state.held.filter((item) => item !== id) : [...state.held, id];
      persist();
      paint(false);
    }
  }
  function onInput(event) {
    const search = event.target?.closest?.("[data-secondary-planner-search]");
    if (!search) return;
    state.query = search.value;
    paint(true);
  }
  function onKeydown(event) {
    if (event.key !== "Escape" || !state.open) return;
    state.open = false;
    paint(false);
  }
  container.addEventListener?.("click", onClick);
  container.addEventListener?.("input", onInput);
  container.addEventListener?.("keydown", onKeydown);
  return () => {
    container.removeEventListener?.("click", onClick);
    container.removeEventListener?.("input", onInput);
    container.removeEventListener?.("keydown", onKeydown);
  };
}
