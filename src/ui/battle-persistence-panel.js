import { restoreSavedBattle, saveCurrentBattle } from "../application/battle-persistence.js";

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function formatUpdatedAt(value) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleString();
}

/**
 * Optional cloud-save controls for the integrated battle shell.
 * The caller injects an authenticated persistence store; this module never
 * creates credentials or couples the UI to a specific storage provider.
 */
export function createBattlePersistencePanel(container, { session, store } = {}) {
  if (!container || typeof container.replaceChildren !== "function") {
    throw new TypeError("A browser container element is required.");
  }
  if (!session || typeof session.getState !== "function" || typeof session.replaceState !== "function") {
    throw new TypeError("A restorable game session is required.");
  }
  for (const method of ["save", "list", "load", "remove"]) {
    if (typeof store?.[method] !== "function") {
      throw new TypeError("A battle persistence store with save, list, load, and remove is required.");
    }
  }

  let records = [];
  let selectedId = "";
  let name = "";
  let message = "";
  let busy = false;
  let confirmDeleteId = "";
  let destroyed = false;

  function render() {
    if (destroyed) return;
    const selected = records.find((record) => record.id === selectedId);
    container.innerHTML = `<section class="battle-persistence" aria-labelledby="battle-persistence-title">
      <div class="battle-persistence__heading">
        <h2 id="battle-persistence-title">Cloud battle saves</h2>
        <span>Single-owner account</span>
      </div>
      <form data-battle-save-form>
        <label for="battle-save-name">Save name</label>
        <input id="battle-save-name" name="name" type="text" maxlength="120"
          value="${escapeHtml(name)}" placeholder="Battle name" ${busy ? "disabled" : ""}>
        <button type="submit" ${busy ? "disabled" : ""}>Save current battle</button>
      </form>
      <div class="battle-persistence__saved">
        <label for="battle-saved-select">Saved battles</label>
        <select id="battle-saved-select" data-battle-saved-select ${busy ? "disabled" : ""}>
          <option value="">Choose a saved battle</option>
          ${records.map((record) => `<option value="${escapeHtml(record.id)}" ${record.id === selectedId ? "selected" : ""}>${escapeHtml(record.name)} — ${escapeHtml(formatUpdatedAt(record.updated_at))}</option>`).join("")}
        </select>
        <div class="battle-persistence__actions">
          <button type="button" data-battle-load ${!selected || busy ? "disabled" : ""}>Load and resume</button>
          <button type="button" data-battle-delete ${!selected || busy ? "disabled" : ""}>${confirmDeleteId === selectedId && selectedId ? "Confirm delete" : "Delete save"}</button>
          <button type="button" data-battle-refresh ${busy ? "disabled" : ""}>Refresh list</button>
        </div>
      </div>
      <p class="battle-persistence__note">Loading replaces the current in-memory battle. Save first if you need to keep its latest changes.</p>
      ${message ? `<p role="status" data-battle-persistence-message>${escapeHtml(message)}</p>` : ""}
    </section>`;
  }

  async function refreshList({ quiet = false } = {}) {
    try {
      const nextRecords = await store.list();
      if (destroyed) return;
      records = Array.isArray(nextRecords) ? nextRecords : [];
      if (!records.some((record) => record.id === selectedId)) selectedId = "";
      if (!quiet) message = records.length ? "Saved battles refreshed." : "No cloud saves yet.";
    } catch (error) {
      if (destroyed) return;
      message = error?.message ?? String(error);
    }
    render();
  }

  async function runAction(action, successMessage) {
    if (busy || destroyed) return;
    busy = true;
    message = "Working…";
    render();
    try {
      await action();
      if (destroyed) return;
      message = successMessage;
      confirmDeleteId = "";
    } catch (error) {
      if (destroyed) return;
      message = error?.message ?? String(error);
    } finally {
      busy = false;
    }
    await refreshList({ quiet: true });
    render();
  }

  function handleInput(event) {
    if (event.target?.matches?.("#battle-save-name")) name = event.target.value;
  }

  function handleChange(event) {
    if (event.target?.matches?.("[data-battle-saved-select]")) {
      selectedId = event.target.value;
      confirmDeleteId = "";
      render();
    }
  }

  function handleSubmit(event) {
    const form = event.target?.closest?.("[data-battle-save-form]");
    if (!form || !container.contains(form)) return;
    event.preventDefault();
    const input = form.querySelector?.("#battle-save-name");
    if (input) name = input.value;
    const existingId = selectedId || null;
    void runAction(async () => {
      const record = await saveCurrentBattle(store, session, { id: existingId, name });
      selectedId = record.id;
      name = record.name;
    }, existingId ? "Battle save updated." : "Battle saved to the cloud.");
  }

  function handleClick(event) {
    const target = event.target?.closest?.("[data-battle-load], [data-battle-delete], [data-battle-refresh]");
    if (!target || !container.contains(target)) return;
    if (target.matches("[data-battle-refresh]")) {
      void runAction(() => store.list().then((items) => {
        records = Array.isArray(items) ? items : [];
        if (!records.some((record) => record.id === selectedId)) selectedId = "";
      }), "Saved battles refreshed.");
      return;
    }
    if (target.matches("[data-battle-load]")) {
      if (!selectedId) return;
      const id = selectedId;
      void runAction(async () => {
        const restored = await restoreSavedBattle(store, session, id);
        name = restored.name ?? "";
        selectedId = restored.id ?? id;
      }, "Battle loaded. You can resume play.");
      return;
    }
    if (target.matches("[data-battle-delete]")) {
      if (!selectedId) return;
      if (confirmDeleteId !== selectedId) {
        confirmDeleteId = selectedId;
        message = "Select Delete save again to permanently remove this saved battle.";
        render();
        return;
      }
      const id = selectedId;
      void runAction(async () => {
        await store.remove(id);
        selectedId = "";
        name = "";
      }, "Saved battle deleted.");
    }
  }

  container.addEventListener?.("input", handleInput);
  container.addEventListener?.("change", handleChange);
  container.addEventListener?.("submit", handleSubmit);
  container.addEventListener?.("click", handleClick);
  render();
  void refreshList();

  return {
    refresh: () => refreshList(),
    destroy() {
      destroyed = true;
      container.removeEventListener?.("input", handleInput);
      container.removeEventListener?.("change", handleChange);
      container.removeEventListener?.("submit", handleSubmit);
      container.removeEventListener?.("click", handleClick);
      container.replaceChildren();
    }
  };
}
