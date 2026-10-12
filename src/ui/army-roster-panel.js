import { createArmyRoster, duplicateArmyRoster } from "../state/army-roster-library.js";
import { findArmyUnitCandidates } from "../data/army-unit-catalog.js";
import { getEligibleBodyguards, attachLeaderToBodyguard, detachLeaderFromBodyguard } from "../state/leader-bodyguard-attachments.js";

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}
function newId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    return (c === "x" ? r : (r & 3 | 8)).toString(16);
  });
}
function now() { return new Date().toISOString(); }

/** Small-screen-friendly CRUD UI for the reusable roster library. */
export function createArmyRosterPanel(container, { store, players = [], onApplyRoster = null, canApply = true } = {}) {
  if (!container || typeof container.replaceChildren !== "function") throw new TypeError("A browser container is required.");
  for (const method of ["save", "list", "load", "remove"]) {
    if (typeof store?.[method] !== "function") throw new TypeError("A roster store with save, list, load, and remove is required.");
  }
  let records = [];
  let selectedId = "";
  let current = null;
  let message = "";
  let unitSearch = "";
  let openUnitDetailId = "";
  let busy = false;
  let destroyed = false;

  function renderAttachmentControls(unit) {
    const attachedBodyguard = unit.attachedToBodyguardId
      ? current?.units.find((candidate) => candidate.id === unit.attachedToBodyguardId)
      : null;
    const attachedLeaders = (unit.attachedLeaderIds ?? [])
      .map((id) => current?.units.find((candidate) => candidate.id === id))
      .filter(Boolean);
    const isLeader = unit.datasheet?.leader?.isLeader === true;
    const isBodyguard = unit.datasheet?.bodyguard?.canReceiveLeader !== undefined ||
      unit.datasheet?.bodyguard?.maxAttachedLeaders !== undefined;
    if (!isLeader && !isBodyguard && !attachedBodyguard && attachedLeaders.length === 0) return "";
    let html = '<section class="army-roster-panel__attachments" aria-label="Leader and Bodyguard attachments"><strong>Leader / Bodyguard</strong>';
    if (attachedBodyguard) {
      html += '<p>Attached to: ' + escapeHtml(attachedBodyguard.name) + '</p>' +
        '<button type="button" data-detach-leader="' + escapeHtml(unit.id) + '" ' + (busy ? "disabled" : "") + '>Detach Leader</button>';
    } else if (isLeader) {
      let eligible = [];
      try { eligible = getEligibleBodyguards(current, unit.id); } catch { eligible = []; }
      if (eligible.length) {
        html += '<label>Attach to Bodyguard<select data-bodyguard-choice="' + escapeHtml(unit.id) + '" ' + (busy ? "disabled" : "") + '><option value="">Choose verified Bodyguard…</option>' +
          eligible.map((bodyguard) => '<option value="' + escapeHtml(bodyguard.id) + '">' + escapeHtml(bodyguard.name) + '</option>').join("") +
          '</select></label><button type="button" data-attach-leader="' + escapeHtml(unit.id) + '" ' + (busy ? "disabled" : "") + '>Attach Leader</button>';
      } else {
        html += '<p>No verified eligible Bodyguard is available. Pairings remain disabled until reviewed datasheet compatibility is recorded.</p>';
      }
    }
    if (isBodyguard) {
      html += '<p>' + (attachedLeaders.length
        ? 'Attached Leader' + (attachedLeaders.length === 1 ? ': ' : 's: ') + attachedLeaders.map((leader) => escapeHtml(leader.name)).join(", ")
        : 'No Leader attached') + '</p>';
    }
    html += '</section>';
    return html;
  }

  function render() {
    if (destroyed) return;
    const options = records.map((record) => '<option value="' + escapeHtml(record.id) + '"' +
      (record.id === selectedId ? " selected" : "") + ">" + escapeHtml(record.name) + "</option>").join("");
    const units = (current?.units ?? []).map((unit) =>
      '<li class="army-roster-panel__unit"><div><strong>' + escapeHtml(unit.name) + '</strong><span> ' +
      escapeHtml(unit.modelCount ?? 1) + ' model(s) · ' + (unit.points == null ? 'Points not set' : escapeHtml(unit.points) + ' pts') + '</span></div>' +
      '<label>Unit points<input data-unit-points="' + escapeHtml(unit.id) + '" type="number" min="0" step="1" value="' + escapeHtml(unit.points ?? "") + '" placeholder="Points" ' + (busy ? "disabled" : "") + '></label>' +
      '<label>Unit notes<textarea data-unit-notes="' + escapeHtml(unit.id) + '" rows="2" maxlength="2000" placeholder="Notes for this unit" ' + (busy ? "disabled" : "") + '>' + escapeHtml(unit.notes ?? "") + '</textarea></label>' +
      '<button type="button" data-save-unit="' + escapeHtml(unit.id) + '" ' + (busy ? "disabled" : "") + '>Save unit</button>' +
      '<button type="button" data-view-unit-detail="' + escapeHtml(unit.id) + '" ' + (busy ? "disabled" : "") + '>View details</button>' +
      renderAttachmentControls(unit) +
      '<button type="button" data-remove-unit="' + escapeHtml(unit.id) + '" ' + (busy ? "disabled" : "") + '>Remove</button>' +
      (openUnitDetailId === unit.id ? '<section aria-label="Unit details"><h5>' + escapeHtml(unit.name) + ' — Unit Details</h5>' +
        '<h6>Characteristics</h6><p>' + escapeHtml(Object.entries(unit.datasheet?.characteristics ?? {}).map(([key, value]) => key + ": " + value).join(" · ") || "Not yet available in the verified catalog.") + '</p>' +
        '<h6>Weapons</h6><ul>' + ((unit.datasheet?.weapons ?? []).map((weapon) => '<li>' + escapeHtml(weapon.name ?? "Weapon") + ': ' + escapeHtml(weapon.range ?? "") + ' · A ' + escapeHtml(weapon.attacks ?? "—") + ' · Skill ' + escapeHtml(weapon.skill ?? "—") + ' · S ' + escapeHtml(weapon.strength ?? "—") + ' · AP ' + escapeHtml(weapon.ap ?? "—") + ' · D ' + escapeHtml(weapon.damage ?? "—") + '</li>').join("") || '<li>Weapon profiles not yet available in the verified catalog.</li>') + '</ul>' +
        '<h6>Special abilities</h6><ul>' + ((unit.datasheet?.abilities ?? []).map((ability) => '<li><strong>' + escapeHtml(ability.name ?? "Ability") + '</strong> ' + escapeHtml(ability.description ?? "") + '</li>').join("") || '<li>Ability text not yet available in the verified catalog.</li>') + '</ul>' +
        '<p>Data status: ' + escapeHtml(unit.dataSource?.status ?? "manual-entry") + '</p><button type="button" data-close-unit-detail="' + escapeHtml(unit.id) + '">Close details</button></section>' : '') +
      '</li>').join("");
    container.innerHTML = '<section class="army-roster-panel" aria-labelledby="army-roster-title">' +
      '<h2 id="army-roster-title">Army Builder &amp; Saved Rosters</h2>' +
      '<p>Create a named roster once, then reuse it for future battles. Unit data entered here is manual; datasheet import/review will be added separately.</p>' +
      '<form data-roster-create><label>New roster name<input name="rosterName" maxlength="120" required placeholder="e.g. Tyranids Tournament List" ' + (busy ? "disabled" : "") + '></label>' +
      '<label>Faction<select name="faction" ' + (busy ? "disabled" : "") + '><option value="">Choose a faction…</option>' + ['Adeptus Custodes','Adeptus Mechanicus','Aeldari','Agents of the Imperium','Astra Militarum','Black Templars','Blood Angels','Chaos Daemons','Chaos Knights','Chaos Space Marines','Dark Angels','Death Guard','Deathwatch','Drukhari','Emperor’s Children','Genestealer Cults','Grey Knights','Imperial Knights','Leagues of Votann','Necrons','Orks','Space Marines','Space Wolves','T’au Empire','Thousand Sons','Tyranids','World Eaters','Other / custom'].map((faction) => '<option value="' + escapeHtml(faction) + '">' + escapeHtml(faction) + '</option>').join("") + '</select></label>' +
      '<label>Points limit<input name="pointsLimit" type="number" min="0" step="1" placeholder="e.g. 2000" ' + (busy ? "disabled" : "") + '></label>' +
      '<button type="submit" ' + (busy ? "disabled" : "") + '>Create roster</button></form>' +
      '<div class="army-roster-panel__saved"><label>Saved rosters<select data-roster-select ' + (busy ? "disabled" : "") + '><option value="">Choose a roster…</option>' + options + '</select></label>' +
      '<div class="army-roster-panel__actions"><button type="button" data-roster-load ' + (!selectedId || busy ? "disabled" : "") + '>Open roster</button>' +
      '<button type="button" data-roster-rename ' + (!current || busy ? "disabled" : "") + '>Save name/details</button>' +
      '<button type="button" data-roster-duplicate ' + (!current || busy ? "disabled" : "") + '>Duplicate</button>' +
      '<button type="button" data-roster-delete ' + (!current || busy ? "disabled" : "") + '>Delete roster</button></div></div>' +
      (current ? '<section class="army-roster-panel__editor"><h3>' + escapeHtml(current.name) + '</h3>' +
        (players.length ? '<div class="army-roster-panel__assign"><label>Assign this roster to player<select data-roster-player>' + players.map((player) => '<option value="' + escapeHtml(player.id) + '">' + escapeHtml(player.name || player.id) + '</option>').join("") + '</select></label><button type="button" data-roster-apply ' + (busy || !canApply || !onApplyRoster ? "disabled" : "") + '>Assign roster to battle</button></div>' : "") +
        '<form data-roster-unit><label>Find unit in faction catalog<input name="unitSearch" data-unit-search maxlength="100" placeholder="Search units…" ' + (busy ? "disabled" : "") + '></label>' +
        '<label>Choose unit<select name="catalogUnitId" data-catalog-unit ' + (busy ? "disabled" : "") + '><option value="">Choose a unit…</option>' + findArmyUnitCandidates({ faction: current.faction, query: unitSearch }).map((unit) => '<option value="' + escapeHtml(unit.id) + '">' + escapeHtml(unit.name) + ' · name only, verify</option>').join("") + '</select></label>' +
        '<label>Model count<input name="modelCount" type="number" min="1" step="1" value="1" required ' + (busy ? "disabled" : "") + '></label>' +
        '<button type="button" data-add-catalog-unit ' + (busy ? "disabled" : "") + '>Add selected unit</button>' +
        '<p>Catalog is a starter list, not a complete or verified datasheet database. Check current official faction documents before relying on a unit entry.</p>' +
        '<details><summary>Add a unit not in the catalog</summary><label>Manual unit name<input name="manualUnitName" maxlength="120" placeholder="Enter unit name" ' + (busy ? "disabled" : "") + '></label><button type="submit" ' + (busy ? "disabled" : "") + '>Add manual unit</button></details></form>' +
        '<p class="army-roster-panel__attachment-status">Leader / Bodyguard: attachment controls are available only when reviewed datasheet compatibility is present. The current starter catalog is name-only, so unverified pairings remain disabled.</p>' +
        '<h4>Roster units (' + current.units.length + ')</h4><p>Total assigned unit points: ' + escapeHtml(current.units.reduce((sum, unit) => sum + (Number.isFinite(unit.points) ? unit.points : 0), 0)) + ' pts · unset unit costs excluded.</p><ul>' + (units || '<li>No units added yet.</li>') + '</ul>' +
        '<div class="army-roster-panel__points"><label>Roster points limit<input data-roster-points-limit type="number" min="0" step="1" placeholder="e.g. 2000" value="' + escapeHtml(current.pointsLimit ?? "") + '" ' + (busy ? "disabled" : "") + '></label><button type="button" data-save-points-limit ' + (busy ? "disabled" : "") + '>Save points limit</button></div>' +
        '<p>Faction: ' + escapeHtml(current.faction || "Not set") + ' · Points limit: ' + escapeHtml(current.pointsLimit ?? "Not set") + '</p></section>' : "") +
      (message ? '<p role="status">' + escapeHtml(message) + '</p>' : "") + '</section>';
  }
  async function refresh() {
    try {
      records = await store.list();
      if (!records.some((r) => r.id === selectedId)) { selectedId = ""; current = null; }
    } catch (error) { message = error?.message ?? String(error); }
    render();
  }
  async function action(fn, success) {
    if (busy || destroyed) return;
    busy = true; message = "Working…"; render();
    try { await fn(); message = success; }
    catch (error) { message = error?.message ?? String(error); }
    finally { busy = false; }
    await refresh();
  }
  function formValues(form) { return Object.fromEntries(new FormData(form).entries()); }
  async function handleSubmit(event) {
    const form = event.target?.closest?.("[data-roster-create], [data-roster-unit]");
    if (!form || !container.contains(form)) return;
    event.preventDefault();
    const values = formValues(form);
    if (form.matches("[data-roster-unit]") && !String(values.manualUnitName ?? "").trim()) {
      event.stopPropagation();
      message = "Choose a catalog unit above, or enter a manual unit name.";
      render();
      return;
    }
    if (form.matches("[data-roster-create]")) {
      await action(async () => {
        const timestamp = now();
        const roster = createArmyRoster({
          id: newId(), name: values.rosterName, faction: values.faction || null,
          pointsLimit: values.pointsLimit === "" ? null : Number(values.pointsLimit),
          units: [], createdAt: timestamp, updatedAt: timestamp
        });
        await store.save({ roster });
        selectedId = roster.id;
        current = (await store.load(roster.id)).roster;
      }, "Roster created and saved.");
      return;
    }
    await action(async () => {
      if (!current) throw new Error("Open a roster before adding units.");
      const updatedAt = now();
      const updated = { ...current, units: [...current.units, {
        id: newId(), name: String(values.manualUnitName).trim(), modelCount: Math.max(1, Number(values.modelCount) || 1), points: null, notes: "", datasheet: null,
        datasheetId: null, dataSource: { status: "manual-entry" }
      }], updatedAt };
      await store.save({ id: updated.id, roster: updated });
      current = updated;
    }, "Unit added and roster saved.");
  }
  async function handleClick(event) {
    const button = event.target?.closest?.("[data-roster-load], [data-roster-rename], [data-roster-duplicate], [data-roster-delete], [data-remove-unit], [data-roster-apply], [data-add-catalog-unit], [data-save-points-limit], [data-save-unit], [data-view-unit-detail], [data-close-unit-detail], [data-attach-leader], [data-detach-leader]");
    if (!button || !container.contains(button)) return;
    if (button.matches("[data-add-catalog-unit]")) {
      // Capture the selected values before action() re-renders the panel in its busy state.
      // Rendering replaces the select element, which otherwise resets the chosen unit to the placeholder.
      const catalogId = container.querySelector("[data-catalog-unit]")?.value;
      const modelCount = Math.max(1, Number(container.querySelector('[name="modelCount"]')?.value) || 1);
      await action(async () => {
        if (!current) throw new Error("Open a roster first.");
        const candidate = findArmyUnitCandidates({ faction: current.faction }).find((unit) => unit.id === catalogId);
        if (!candidate) throw new Error("Choose a unit from the catalog first.");
        const updated = { ...current, units: [...current.units, {
          id: newId(), name: candidate.name, modelCount, points: null, notes: "", datasheet: candidate.datasheet ?? null,
          datasheetId: candidate.id, dataSource: { status: candidate.verificationStatus, sourceName: candidate.sourceName, sourceUrl: candidate.sourceUrl, reviewedAt: null }
        }], updatedAt: now() };
        await store.save({ id: updated.id, roster: updated }); current = updated;
      }, "Catalog candidate added. Verify its current datasheet before use.");
      return;
    }
    if (button.matches("[data-view-unit-detail]")) {
      openUnitDetailId = button.getAttribute("data-view-unit-detail") || "";
      render();
      return;
    }
    if (button.matches("[data-close-unit-detail]")) {
      openUnitDetailId = "";
      render();
      return;
    }
    if (button.matches("[data-attach-leader]")) {
      const leaderId = button.getAttribute("data-attach-leader");
      const bodyguardId = container.querySelector('[data-bodyguard-choice="' + leaderId + '"]')?.value;
      await action(async () => {
        if (!current) throw new Error("Open a roster first.");
        if (!bodyguardId) throw new Error("Choose a verified eligible Bodyguard first.");
        const updated = attachLeaderToBodyguard(current, leaderId, bodyguardId, { updatedAt: now() });
        await store.save({ id: updated.id, roster: updated });
        current = updated;
      }, "Leader attached to Bodyguard and roster saved.");
      return;
    }
    if (button.matches("[data-detach-leader]")) {
      const leaderId = button.getAttribute("data-detach-leader");
      await action(async () => {
        if (!current) throw new Error("Open a roster first.");
        const updated = detachLeaderFromBodyguard(current, leaderId, { updatedAt: now() });
        await store.save({ id: updated.id, roster: updated });
        current = updated;
      }, "Leader detached and roster saved.");
      return;
    }
    if (button.matches("[data-save-unit]")) {
      const unitId = button.getAttribute("data-save-unit");
      const pointsText = container.querySelector('[data-unit-points="' + unitId + '"]')?.value ?? "";
      const notes = container.querySelector('[data-unit-notes="' + unitId + '"]')?.value ?? "";
      await action(async () => {
        if (!current) throw new Error("Open a roster before editing a unit.");
        const points = pointsText.trim() === "" ? null : Number(pointsText);
        if (points !== null && (!Number.isFinite(points) || points < 0)) throw new Error("Enter a valid non-negative points value, or leave it blank.");
        const updated = { ...current, units: current.units.map((unit) => unit.id === unitId ? { ...unit, points, notes: notes.trim() } : unit), updatedAt: now() };
        await store.save({ id: updated.id, roster: updated });
        current = updated;
      }, "Unit points and notes saved.");
      return;
    }
    if (button.matches("[data-save-points-limit]")) {
      const pointsText = container.querySelector("[data-roster-points-limit]")?.value ?? "";
      await action(async () => {
        if (!current) throw new Error("Open a roster before changing its points limit.");
        const pointsLimit = pointsText.trim() === "" ? null : Number(pointsText);
        if (pointsLimit !== null && (!Number.isFinite(pointsLimit) || pointsLimit < 0)) {
          throw new Error("Enter a valid points limit, or leave it blank.");
        }
        const updated = { ...current, pointsLimit, updatedAt: now() };
        await store.save({ id: updated.id, roster: updated });
        current = updated;
      }, "Roster points limit saved.");
      return;
    }
    if (button.matches("[data-roster-apply]")) {
      await action(async () => {
        if (!current || !onApplyRoster) throw new Error("Open a roster before assigning it.");
        const playerId = container.querySelector("[data-roster-player]")?.value;
        await onApplyRoster(current, playerId);
      }, "Roster assigned to this battle. Its units are now available for deployment planning.");
      return;
    }
    if (button.matches("[data-roster-load]")) {
      await action(async () => {
        selectedId = container.querySelector("[data-roster-select]")?.value || selectedId;
        if (!selectedId) throw new Error("Choose a saved roster first.");
        current = (await store.load(selectedId)).roster;
      }, "Roster loaded.");
      return;
    }
    if (button.matches("[data-roster-rename]")) {
      await action(async () => {
        if (!current) throw new Error("Open a roster first.");
        const name = window.prompt("Roster name", current.name);
        if (name == null) return;
        const faction = window.prompt("Faction", current.faction ?? "") ?? current.faction;
        const pointsText = window.prompt("Points limit (leave blank if unknown)", current.pointsLimit ?? "") ;
        if (pointsText == null) return;
        const updated = { ...current, name: name.trim(), faction: faction?.trim() || null,
          pointsLimit: pointsText.trim() === "" ? null : Number(pointsText), updatedAt: now() };
        await store.save({ id: updated.id, roster: updated }); current = updated;
      }, "Roster details saved.");
      return;
    }
    if (button.matches("[data-roster-duplicate]")) {
      await action(async () => {
        if (!current) throw new Error("Open a roster first.");
        const name = window.prompt("Name for the duplicate", current.name + " Copy");
        if (name == null) return;
        const timestamp = now();
        const copy = duplicateArmyRoster(current, { id: newId(), name, createdAt: timestamp, updatedAt: timestamp });
        const remappedIds = new Map(copy.units.map((unit) => [unit.id, newId()]));
        copy.units = copy.units.map((unit) => {
          const cloned = { ...unit, id: remappedIds.get(unit.id) };
          if (unit.attachedToBodyguardId) cloned.attachedToBodyguardId = remappedIds.get(unit.attachedToBodyguardId) ?? unit.attachedToBodyguardId;
          if (Array.isArray(unit.attachedLeaderIds)) cloned.attachedLeaderIds = unit.attachedLeaderIds.map((id) => remappedIds.get(id) ?? id);
          return cloned;
        });
        await store.save({ roster: copy }); selectedId = copy.id; current = copy;
      }, "Independent roster copy created.");
      return;
    }
    if (button.matches("[data-roster-delete]")) {
      await action(async () => {
        if (!current) throw new Error("Open a roster first.");
        if (!window.confirm('Delete "' + current.name + '"? This cannot be undone.')) return;
        await store.remove(current.id); selectedId = ""; current = null;
      }, "Roster deleted.");
      return;
    }
    if (button.matches("[data-remove-unit]")) {
      await action(async () => {
        if (!current) throw new Error("Open a roster first.");
        const unitId = button.getAttribute("data-remove-unit");
        // Detach every relationship touching the unit before removing it, so neither side
        // retains a dangling attachment reference.
        let cleaned = current;
        for (const leader of [...cleaned.units]) {
          if (leader.id === unitId || leader.attachedToBodyguardId === unitId) {
            cleaned = detachLeaderFromBodyguard(cleaned, leader.id, { updatedAt: now() });
          }
        }
        const updated = { ...cleaned, units: cleaned.units.filter((unit) => unit.id !== unitId), updatedAt: now() };
        await store.save({ id: updated.id, roster: updated }); current = updated;
      }, "Unit removed and roster saved.");
    }
  }
  function handleInput(event) {
    if (event.target?.matches?.("[data-unit-search]")) {
      unitSearch = event.target.value;
      const select = container.querySelector("[data-catalog-unit]");
      if (select) {
        const selected = select.value;
        select.innerHTML = '<option value="">Choose a unit…</option>' + findArmyUnitCandidates({ faction: current?.faction, query: unitSearch })
          .map((unit) => '<option value="' + escapeHtml(unit.id) + '">' + escapeHtml(unit.name) + ' · name only, verify</option>').join("");
        if ([...select.options].some((option) => option.value === selected)) select.value = selected;
      }
    }
  }
  function handleChange(event) {
    if (event.target?.matches?.("[data-roster-select]")) {
      selectedId = event.target.value || "";
      current = null; message = ""; render();
    }
  }
  container.addEventListener("submit", handleSubmit);
  container.addEventListener("input", handleInput);
  container.addEventListener("click", handleClick);
  container.addEventListener("change", handleChange);
  void refresh();
  return {
    refresh,
    destroy() {
      destroyed = true;
      container.removeEventListener("submit", handleSubmit);
      container.removeEventListener("input", handleInput);
      container.removeEventListener("click", handleClick);
      container.removeEventListener("change", handleChange);
      container.replaceChildren();
    }
  };
}
