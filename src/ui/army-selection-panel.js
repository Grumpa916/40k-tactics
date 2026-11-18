import { COMMAND_TYPES } from "../commands/game-commands.js";
import { importArmyRoster } from "../state/army-roster-import.js";
import { importWarhammerAppRoster } from "../state/warhammer-app-roster-import.js";
import { ARMY_UNIT_CATALOG } from "../data/army-unit-catalog.js";

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function newId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === "x" ? r : (r & 3 | 8)).toString(16);
  });
}

const IMPORT_FACTIONS = [...new Set(ARMY_UNIT_CATALOG.map(unit => unit.faction).filter(Boolean))].sort();

function normalizeFactionText(value) {
  return String(value ?? "").normalize("NFKD").replace(/[\\u0300-\\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function detectFaction(text) {
  const lines = String(text ?? "").split(/\\r?\\n/).filter(line => line.trim()).slice(0, 12);
  const ranked = new Map();
  for (const rawLine of lines) {
    const line = normalizeFactionText(rawLine);
    for (const faction of IMPORT_FACTIONS) {
      const normalized = normalizeFactionText(faction);
      const score = line === normalized ? 3 : line.startsWith(normalized + " ") ? 2 : line.includes(" " + normalized + " ") ? 1 : 0;
      if (score > (ranked.get(faction) ?? 0)) ranked.set(faction, score);
    }
  }
  const matches = [...ranked].filter(([, score]) => score > 0).sort((a, b) => b[1] - a[1]);
  return matches.length && (matches.length === 1 || matches[0][1] > matches[1][1]) ? matches[0][0] : null;
}

function rosterValue(record) {
  return record?.roster && typeof record.roster === "object" ? record.roster : record;
}

function rosterFaction(record) {
  return rosterValue(record)?.faction ?? null;
}

function rosterDetachmentLabel(record) {
  const roster = rosterValue(record);
  const names = [...new Set([
    ...(Array.isArray(roster?.detachments) ? roster.detachments : []),
    roster?.detachment,
    roster?.detachmentName
  ].map((name) => String(name ?? "").trim()).filter(Boolean))];
  return names.length ? names.join(" + ") : null;
}

/**
 * Battle-specific roster assignment. The saved roster library remains editable
 * only in Army Builder; this screen applies a saved snapshot to one battle side.
 */
export function createArmySelectionPanel(container, { store, session, canApply = true } = {}) {
  if (!container || !session || typeof session.getState !== "function") {
    throw new TypeError("A container and battle session are required.");
  }
  let records = [];
  let message = "";
  let busyPlayerId = null;
  let destroyed = false;

  function render() {
    if (destroyed) return;
    const state = session.getState();
    const players = Array.isArray(state.players) ? state.players : [];
    const currentCanApply = canApply && state.phase === "setup" && state.battle?.status === "setup";
    const sides = players.map((player, index) => {
      const roster = state.armyRosters?.[player.id] ?? null;
      const label = players.length === 2 ? (index === 0 ? "Your Army" : "Opponent Army") : (player.name ?? player.id);
      const rosterId = roster?.id ?? "";
      const points = Array.isArray(roster?.units)
        ? roster.units.reduce((sum, unit) => sum + (Number.isFinite(Number(unit.points)) ? Number(unit.points) : 0), 0)
        : null;
      const unsetPoints = (roster?.units ?? []).filter(unit => unit.points == null).length;
      return '<article class="army-selection-card" data-army-selection-side="' + escapeHtml(player.id) + '">' +
        '<h3>' + escapeHtml(label) + '</h3>' +
        (roster ? '<p class="army-selection-card__name"><strong>' + escapeHtml(roster.name ?? "Unnamed roster") + '</strong></p>' +
          '<dl><div><dt>Faction</dt><dd>' + escapeHtml(rosterFaction(roster) ?? "Not set") + '</dd></div>' +
          '<div><dt>Detachment</dt><dd>' + escapeHtml(rosterDetachmentLabel(roster) ?? "Not set") + '</dd></div>' +
          '<div><dt>Units</dt><dd>' + escapeHtml(roster.units?.length ?? 0) + '</dd></div>' +
          '<div><dt>Unit points total</dt><dd>' + (points === null ? "Not set" : escapeHtml(points) + " pts") + '</dd></div></dl>' +
          (unsetPoints ? '<p class="army-selection-card__note">' + unsetPoints + ' unit(s) still need points checked.</p>' : '') :
          '<p class="army-selection-card__empty">No army assigned yet.</p>') +
        '<label>Saved roster<select data-army-selection-roster="' + escapeHtml(player.id) + '"' +
        (!currentCanApply || busyPlayerId ? " disabled" : "") + '><option value="">Choose a saved roster…</option>' +
        records.map(record => '<option value="' + escapeHtml(record.id) + '"' + (record.id === rosterId ? " selected" : "") + '>' +
          escapeHtml(record.name) + ' · ' + escapeHtml(rosterFaction(record) ?? "Faction not set") + ' · ' +
          escapeHtml(rosterDetachmentLabel(record) ?? "Detachment not set") + '</option>').join("") +
        '</select></label>' +
        (index === 1 && players.length === 2
          ? '<label class="army-selection-card__import">Import list file (.json or .txt)<input type="file" accept=".json,.txt,application/json,text/plain" data-army-selection-import="' + escapeHtml(player.id) + '"' +
            (!currentCanApply || busyPlayerId ? " disabled" : "") + '></label>' +
            '<p class="army-selection-card__hint">Use a 40K Tactics JSON export or a Warmind Official App text export.</p>' +
            '<details class="army-selection-card__warmind"><summary>Paste a Warmind list</summary>' +
            '<p>In Warmind, share the list as Official App text in English, then paste it below.</p>' +
            '<label>Faction (auto-detected when possible)<select data-army-selection-warmind-faction="' + escapeHtml(player.id) + '"' +
            (!currentCanApply || busyPlayerId ? " disabled" : "") + '><option value="">Auto-detect</option>' +
            IMPORT_FACTIONS.map(faction => '<option value="' + escapeHtml(faction) + '">' + escapeHtml(faction) + '</option>').join("") +
            '</select></label>' +
            '<label>Warmind list text<textarea rows="7" data-army-selection-warmind-text="' + escapeHtml(player.id) + '"' +
            (!currentCanApply || busyPlayerId ? " disabled" : "") + ' placeholder="Paste the shared list text here"></textarea></label>' +
            '<button type="button" data-army-selection-warmind-import="' + escapeHtml(player.id) + '"' +
            (!currentCanApply || busyPlayerId ? " disabled" : "") + '>Import and assign opponent list</button></details>'
          : '') +
        '<button type="button" data-army-selection-apply="' + escapeHtml(player.id) + '"' +
        (!currentCanApply || busyPlayerId ? " disabled" : "") + '>Use selected roster</button></article>';
    }).join("");
    const battleSetup = state.battleSetup ?? {};
    const selectedSize = battleSetup.battleSize ?? "";
    const sizeMarkup = '<section class="army-selection__battle-size"><h3>Battle size</h3>' +
      '<label>Agreed game size<select data-battle-size' + (!currentCanApply ? " disabled" : "") + '>' +
      '<option value="">Choose battle size…</option>' +
      '<option value="incursion"' + (selectedSize === "incursion" ? " selected" : "") + '>Incursion · 1,000 points</option>' +
      '<option value="strike_force"' + (selectedSize === "strike_force" ? " selected" : "") + '>Strike Force · 2,000 points</option>' +
      '</select></label>' +
      '</section>';
    container.innerHTML = '<style>.army-selection{display:grid;gap:14px;background:#101820;color:#edf4f7}.army-selection header h2{margin:0 0 8px}.army-selection{color:#edf4f7}.army-selection__battle-size,.army-selection-card{padding:14px;border:1px solid #43535c;border-radius:9px;background:#172129;color:#edf4f7}.army-selection__battle-size label,.army-selection-card label{display:grid;gap:7px;margin:10px 0;font-weight:700}.army-selection select{box-sizing:border-box;width:100%;min-height:44px;padding:9px 10px;font-size:14px;border:1px solid #536987;border-radius:6px;background:#101820;color:#edf4f7}.army-selection-card__import{box-sizing:border-box;width:100%;min-height:44px;padding:10px 12px;border:1px solid #536987;border-radius:6px;background:#202b33;color:#edf4f7;font-size:14px;font-weight:700}.army-selection-card__import input{display:block;box-sizing:border-box;width:100%;margin-top:8px;color:#edf4f7;font-size:13px}.army-selection-card__hint{margin:0 0 10px;color:#aebbc5;font-size:12px}.army-selection-card__warmind{margin:10px 0;padding:10px;border:1px solid #43535c;border-radius:7px;background:#131c22}.army-selection-card__warmind summary{cursor:pointer;font-weight:700}.army-selection-card__warmind p{font-size:13px;line-height:1.4;color:#c3cdd4}.army-selection-card__warmind textarea{box-sizing:border-box;width:100%;min-height:130px;padding:10px;border:1px solid #536987;border-radius:6px;background:#101820;color:#edf4f7;font:14px/1.4 sans-serif;resize:vertical}.army-selection button{width:100%;min-height:44px;padding:10px 12px;border:1px solid #536987;border-radius:6px;background:#202b33;color:#edf4f7;font-size:14px;font-weight:700;cursor:pointer}.army-selection__sides{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.army-selection-card h3{margin:0 0 8px}.army-selection-card dl{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.army-selection-card dl div{padding:8px;background:#202d36;border-radius:6px;min-width:0}.army-selection-card dt{font-size:11px;color:#aebbc5}.army-selection-card dd{margin:3px 0 0;font-weight:700;overflow-wrap:anywhere}.army-selection__message{margin:0;padding:8px 10px;border-radius:6px;background:#202d36;color:#edf4f7}@media(max-width:700px){.army-selection__sides{grid-template-columns:1fr}.army-selection__battle-size,.army-selection-card{padding:12px}}</style><section class="army-selection" aria-label="Army selection">' +
      sizeMarkup +
      '<div class="army-selection__sides">' + sides + '</div>' +
      '<p class="army-selection__message" role="status">' + escapeHtml(message) + '</p>' +
      '<button type="button" data-army-selection-refresh' + (busyPlayerId ? " disabled" : "") + '>Refresh saved lists</button></section>';
  }

  async function refresh() {
    try {
      if (!store || typeof store.list !== "function") throw new Error("Sign in to access saved army lists.");
      const listed = await store.list();
      records = await Promise.all((Array.isArray(listed) ? listed : []).map(async (record) => {
        if (record?.roster || !record?.id || typeof store.load !== "function") return record;
        try {
          const loaded = await store.load(record.id);
          return loaded?.roster ? { ...record, roster: loaded.roster } : record;
        } catch {
          return record;
        }
      }));
      message = records.length ? "" : "No saved lists found. Open Army Builder to create your first list.";
    } catch (error) {
      message = error?.message ?? String(error);
    }
    render();
  }

  async function assignImportedRoster(playerId, buildRoster) {
    if (busyPlayerId) return;
    busyPlayerId = playerId;
    message = "Importing opponent list…";
    render();
    try {
      if (!store || typeof store.save !== "function") throw new Error("Sign in to save and use imported lists.");
      const { roster, detail = "" } = await buildRoster();
      if (!roster?.id || !Array.isArray(roster.units)) throw new Error("The imported list did not produce a usable roster.");
      await store.save({ roster });
      records = [{ id: roster.id, name: roster.name, roster }, ...records.filter(record => record.id !== roster.id)];
      session.dispatch({ type: "battle.apply_army_roster", payload: { roster, playerId } });
      message = detail || "Imported “" + roster.name + "”, saved it to your lists, and assigned it to the opponent.";
    } catch (error) {
      message = error?.message ?? String(error);
    } finally {
      busyPlayerId = null;
      render();
    }
  }

  function importTextRoster(text, faction, name) {
    const selectedFaction = faction || detectFaction(text);
    if (!selectedFaction) throw new Error("Choose the list faction; it could not be detected from the shared text.");
    const timestamp = new Date().toISOString();
    const parsed = importWarhammerAppRoster({
      text, faction: selectedFaction, name: name || "Warmind — " + selectedFaction,
      id: newId(), createdAt: timestamp, updatedAt: timestamp
    });
    const roster = parsed.roster;
    roster.notes = "Imported from Warmind's Official App text export. Original text is preserved below for review.\\n\\n" + text;
    for (const unit of roster.units) {
      if (unit.dataSource) unit.dataSource.rosterImport = "warmind-text";
    }
    const warningCount = (parsed.warnings?.length ?? 0) + (parsed.unrecognized?.length ?? 0);
    const detail = warningCount
      ? "Imported " + roster.units.length + " units from Warmind. Review the saved roster: " + warningCount + " unmatched or warning item(s) were preserved."
      : "Imported " + roster.units.length + " units from Warmind, saved the list, and assigned it to the opponent.";
    return { roster, detail };
  }

  async function importRosterFile(file, playerId) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      message = "This file is over 5 MB. Choose a smaller roster export.";
      render();
      return;
    }
    const text = await file.text();
    const timestamp = new Date().toISOString();
    const isJson = /\\.json$/i.test(file.name) || text.trimStart().startsWith("{");
    const name = file.name.replace(/\\.(?:json|txt)$/i, "").replace(/[-_]+/g, " ").trim();
    await assignImportedRoster(playerId, async () => {
      if (isJson) {
        const roster = importArmyRoster(text, newId, timestamp);
        if (!String(roster.name ?? "").trim()) roster.name = name || "Imported opponent list";
        return { roster };
      }
      return importTextRoster(text, "", name ? "Warmind — " + name : "");
    });
  }

  async function handleChange(event) {
    const fileInput = event.target?.closest?.("[data-army-selection-import]");
    if (fileInput && container.contains(fileInput)) {
      const file = fileInput.files?.[0];
      const playerId = fileInput.getAttribute("data-army-selection-import");
      if (!file || busyPlayerId) return;
      await importRosterFile(file, playerId);
      fileInput.value = "";
      return;
    }
    const select = event.target?.closest?.("[data-battle-size]");
    if (!select || !container.contains(select)) return;
    try {
      session.dispatch({ type: COMMAND_TYPES.SET_BATTLE_SIZE, payload: { battleSize: select.value || null } });
      message = select.value ? "Battle size saved for this battle." : "Choose the agreed battle size.";
    } catch (error) {
      message = error?.message ?? String(error);
    }
    render();
  }

  async function handleClick(event) {
    const applyButton = event.target?.closest?.("[data-army-selection-apply]");
    const refreshButton = event.target?.closest?.("[data-army-selection-refresh]");
    const warmindButton = event.target?.closest?.("[data-army-selection-warmind-import]");
    if (!applyButton && !refreshButton && !warmindButton) return;
    if (!container.contains(applyButton ?? refreshButton ?? warmindButton)) return;
    if (warmindButton) {
      const playerId = warmindButton.getAttribute("data-army-selection-warmind-import");
      const text = container.querySelector('[data-army-selection-warmind-text="' + playerId + '"]')?.value ?? "";
      const faction = container.querySelector('[data-army-selection-warmind-faction="' + playerId + '"]')?.value ?? "";
      if (!text.trim()) {
        message = "Paste the Warmind Official App text export first.";
        render();
        return;
      }
      await assignImportedRoster(playerId, () => importTextRoster(text, faction, ""));
      return;
    }
    if (refreshButton) {
      await refresh();
      return;
    }
    const playerId = applyButton.getAttribute("data-army-selection-apply");
    const select = container.querySelector('[data-army-selection-roster="' + playerId + '"]');
    const rosterId = select?.value ?? "";
    if (!rosterId) {
      message = "Choose a saved roster for this side first.";
      render();
      return;
    }
    busyPlayerId = playerId;
    message = "Loading roster…";
    render();
    try {
      const result = await store.load(rosterId);
      if (!result?.roster) throw new Error("The selected saved roster could not be loaded.");
      session.dispatch({ type: "battle.apply_army_roster", payload: { roster: result.roster, playerId } });
      message = "Roster assigned to this battle side.";
    } catch (error) {
      message = error?.message ?? String(error);
    } finally {
      busyPlayerId = null;
      render();
    }
  }

  container.addEventListener?.("click", handleClick);
  container.addEventListener?.("change", handleChange);
  const unsubscribe = session.subscribe?.(render) ?? (() => {});
  void refresh();
  return {
    refresh,
    destroy() {
      destroyed = true;
      unsubscribe();
      container.removeEventListener?.("click", handleClick);
      container.removeEventListener?.("change", handleChange);
    }
  };
}
