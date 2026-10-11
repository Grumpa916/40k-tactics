import { createArmyRoster, duplicateArmyRoster } from "../state/army-roster-library.js";

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
export function createArmyRosterPanel(container, { store } = {}) {
  if (!container || typeof container.replaceChildren !== "function") throw new TypeError("A browser container is required.");
  for (const method of ["save", "list", "load", "remove"]) {
    if (typeof store?.[method] !== "function") throw new TypeError("A roster store with save, list, load, and remove is required.");
  }
  let records = [];
  let selectedId = "";
  let current = null;
  let message = "";
  let busy = false;
  let destroyed = false;

  function render() {
    if (destroyed) return;
    const options = records.map((record) => '<option value="' + escapeHtml(record.id) + '"' +
      (record.id === selectedId ? " selected" : "") + ">" + escapeHtml(record.name) + "</option>").join("");
    const units = (current?.units ?? []).map((unit) =>
      '<li><div><strong>' + escapeHtml(unit.name) + '</strong><span> ' +
      escapeHtml(unit.modelCount ?? 1) + ' model(s)</span></div><button type="button" data-remove-unit="' +
      escapeHtml(unit.id) + '" ' + (busy ? "disabled" : "") + '>Remove</button></li>').join("");
    container.innerHTML = '<section class="army-roster-panel" aria-labelledby="army-roster-title">' +
      '<h2 id="army-roster-title">Army Builder &amp; Saved Rosters</h2>' +
      '<p>Create a named roster once, then reuse it for future battles. Unit data entered here is manual; datasheet import/review will be added separately.</p>' +
      '<form data-roster-create><label>New roster name<input name="rosterName" maxlength="120" required placeholder="e.g. Tyranids Tournament List" ' + (busy ? "disabled" : "") + '></label>' +
      '<label>Faction<input name="faction" maxlength="100" placeholder="e.g. Tyranids" ' + (busy ? "disabled" : "") + '></label>' +
      '<label>Points limit<input name="pointsLimit" type="number" min="0" step="1" placeholder="2000" ' + (busy ? "disabled" : "") + '></label>' +
      '<button type="submit" ' + (busy ? "disabled" : "") + '>Create roster</button></form>' +
      '<div class="army-roster-panel__saved"><label>Saved rosters<select data-roster-select ' + (busy ? "disabled" : "") + '><option value="">Choose a roster…</option>' + options + '</select></label>' +
      '<div class="army-roster-panel__actions"><button type="button" data-roster-load ' + (!selectedId || busy ? "disabled" : "") + '>Open roster</button>' +
      '<button type="button" data-roster-rename ' + (!current || busy ? "disabled" : "") + '>Save name/details</button>' +
      '<button type="button" data-roster-duplicate ' + (!current || busy ? "disabled" : "") + '>Duplicate</button>' +
      '<button type="button" data-roster-delete ' + (!current || busy ? "disabled" : "") + '>Delete roster</button></div></div>' +
      (current ? '<section class="army-roster-panel__editor"><h3>' + escapeHtml(current.name) + '</h3>' +
        '<form data-roster-unit><label>Unit name<input name="unitName" maxlength="120" required placeholder="e.g. Exocrine" ' + (busy ? "disabled" : "") + '></label>' +
        '<label>Model count<input name="modelCount" type="number" min="1" step="1" value="1" required ' + (busy ? "disabled" : "") + '></label>' +
        '<button type="submit" ' + (busy ? "disabled" : "") + '>Add unit</button></form>' +
        '<h4>Roster units (' + current.units.length + ')</h4><ul>' + (units || '<li>No units added yet.</li>') + '</ul>' +
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
        id: newId(), name: String(values.unitName).trim(), modelCount: Math.max(1, Number(values.modelCount) || 1),
        datasheetId: null, dataSource: { status: "manual-entry" }
      }], updatedAt };
      await store.save({ id: updated.id, roster: updated });
      current = updated;
    }, "Unit added and roster saved.");
  }
  async function handleClick(event) {
    const button = event.target?.closest?.("[data-roster-load], [data-roster-rename], [data-roster-duplicate], [data-roster-delete], [data-remove-unit]");
    if (!button || !container.contains(button)) return;
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
        copy.units = copy.units.map((unit) => ({ ...unit, id: newId() }));
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
        const updated = { ...current, units: current.units.filter((unit) => unit.id !== unitId), updatedAt: now() };
        await store.save({ id: updated.id, roster: updated }); current = updated;
      }, "Unit removed and roster saved.");
    }
  }
  function handleChange(event) {
    if (event.target?.matches?.("[data-roster-select]")) {
      selectedId = event.target.value || "";
      current = null; message = ""; render();
    }
  }
  container.addEventListener("submit", handleSubmit);
  container.addEventListener("click", handleClick);
  container.addEventListener("change", handleChange);
  void refresh();
  return {
    refresh,
    destroy() {
      destroyed = true;
      container.removeEventListener("submit", handleSubmit);
      container.removeEventListener("click", handleClick);
      container.removeEventListener("change", handleChange);
      container.replaceChildren();
    }
  };
}
