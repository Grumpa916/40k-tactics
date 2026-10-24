import { importWarhammerAppRoster } from "../state/warhammer-app-roster-import.js";
import { escapeHtml } from "./army-builder-html.js";
import { importArmyRoster } from "../state/army-roster-import.js";
import { renderArmyBuilder, renderCatalogResults } from "./army-builder-view.js";
import { detachmentOptions } from "./army-builder-options.js";
import { createArmyRoster, duplicateArmyRoster, remapRosterUnitIds, removeUnitFromRoster } from "../state/army-roster-library.js";
import { findArmyUnitCandidates } from "../data/army-unit-catalog.js";
import { createRulesDataRevisionStamp } from "../data/rules-data-revisions.js";
import { getTyranidWargearRuleSet } from "../data/tyranid-wargear-rules.js";
import { assessRosterRulesData, revalidateRosterRulesData } from "../rules/roster-rules-data-validation.js";
import { attachLeaderToBodyguard, detachLeaderFromBodyguard } from "../state/leader-bodyguard-attachments.js";
import { resolveInitialUnitPoints } from "../state/army-roster-unit-costs.js";
import { buildManualWargearLoadout } from "../rules/wargear-loadout-validation.js";
import { normalizeRosterDetachmentSelection } from "../rules/roster-detachment-selection.js";
import { createArmyUnitEditorController } from "./army-unit-editor-controller.js";

function newId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    return (c === "x" ? r : (r & 3 | 8)).toString(16);
  });
}
function now() { return new Date().toISOString(); }
function pendingManualWargearValidation(ruleSet) {
  if (!ruleSet) return null;
  return {
    status: "manual-selection-required",
    reviewedRules: true,
    source: "manual-army-builder",
    sourceName: ruleSet.sourceName,
    sourceUrl: ruleSet.sourceUrl,
    reviewedAt: ruleSet.reviewedAt,
    errors: ["Choose and save this unit's actual wargear before using combat advice."]
  };
}

/** Small-screen-friendly CRUD UI for the reusable roster library. */
export function createArmyRosterPanel(container, { store, players = [], onApplyRoster = null, canApply = true } = {}) {
  if (!container || typeof container.replaceChildren !== "function") throw new TypeError("A browser container is required.");
  for (const method of ["save", "list", "load", "remove"]) {
    if (typeof store?.[method] !== "function") throw new TypeError("A roster store with save, list, load, and remove is required.");
  }
  let records = [];
  const rosterCache = new Map();
  let selectedId = "";
  let current = null;
  let message = "";
  let unitSearch = "";
  let openUnitDetailId = "";
  let busy = false;
  let destroyed = false;

  let page = "library";
  let category = "";
  let sort = "name";
  let fits = false;
  let previewId = "";
  const unitEditor=createArmyUnitEditorController(container,{
    getUnit:()=>current?.units?.find(unit=>unit.id===openUnitDetailId),getRoster:()=>current,render
  });
  function render() {
    if (destroyed) return;
    container.innerHTML = renderArmyBuilder({records, current, unitDraft:unitEditor.getDraft(current?.units?.find(unit=>unit.id===openUnitDetailId)), page, busy, message, unitSearch, category, sort, fits, previewId, openUnitDetailId, players, canApply, onApplyRoster});
  }
  async function refresh() {
    try {
      records = await store.list();
      if (current) rosterCache.set(current.id, current);
      records = await Promise.all(records.map(async record => {
        if (!rosterCache.has(record.id)) {
          try { rosterCache.set(record.id, (await store.load(record.id)).roster); } catch { /* A card can still open and report its load error. */ }
        }
        return {...record, roster:rosterCache.get(record.id)};
      }));
      if (!records.some((r) => r.id === selectedId)) { selectedId = ""; current = null; }
    } catch (error) { message = error?.message ?? String(error); }
    render();
  }
  async function action(fn, success) {
    if (busy || destroyed) return;
    busy = true; message = "Working…"; render();
    try { await fn(); message = typeof success === "function" ? success() : success; }
    catch (error) { message = error?.message ?? String(error); }
    finally { busy = false; }
    await refresh();
  }
  function formValues(form) { return Object.fromEntries(new FormData(form).entries()); }
  async function handleSubmit(event) {
    const form = event.target?.closest?.("[data-roster-create], [data-roster-unit], [data-warhammer-import]");
    if (!form || !container.contains(form)) return;
    event.preventDefault();
    const values = formValues(form);
    if (form.matches("[data-roster-unit]") && !String(values.manualUnitName ?? "").trim()) {
      event.stopPropagation();
      message = "Choose a catalog unit above, or enter a manual unit name.";
      render();
      return;
    }
    if (form.matches("[data-warhammer-import]")) {
      let importedSummary="Army list imported and saved.";
      await action(async()=>{
        const imported=importWarhammerAppRoster({text:values.rosterText,faction:values.faction,name:values.rosterName,pointsLimit:values.pointsLimit===""?null:Number(values.pointsLimit),id:newId(),createdAt:now(),updatedAt:now()});
        if(imported.unrecognized.length && values.acknowledgeUnmatched!=="yes") throw new Error("Review the unrecognized point lines below, then confirm they are preserved in the saved list notes.");
        await store.save({roster:imported.roster}); selectedId=imported.roster.id; current=(await store.load(selectedId)).roster; page="editor";
        importedSummary=imported.unrecognized.length?`${imported.roster.units.length} units imported. ${imported.unrecognized.length} unrecognized point line(s) remain in list notes for review.`:`${imported.roster.units.length} units imported and saved.`;
      }, ()=>importedSummary); return;
    }
    if (form.matches("[data-roster-create]")) {
      await action(async () => {
        const timestamp = now();
        const initialDetachment=(values.detachment === "__custom__" ? values.customDetachment : values.detachment)?.trim() || null;
        const roster = createArmyRoster({
          id: newId(), name: values.rosterName, faction: values.faction || null,
          detachment: initialDetachment, detachments: initialDetachment?[initialDetachment]:[],
          pointsLimit: values.pointsLimit === "" ? null : Number(values.pointsLimit),
          units: [], rulesDataRevision: createRulesDataRevisionStamp(values.faction), createdAt: timestamp, updatedAt: timestamp
        });
        await store.save({ roster });
        selectedId = roster.id;
        current = (await store.load(roster.id)).roster; page = "editor";
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
    if(!busy&&unitEditor.handleClick(event))return;
    const button = event.target?.closest?.("[data-builder-page], [data-preview-unit], [data-builder-browse], [data-points-preset], [data-roster-import], [data-roster-export], [data-roster-load], [data-roster-rename], [data-roster-duplicate], [data-roster-delete], [data-roster-save], [data-remove-unit], [data-roster-apply], [data-add-catalog-unit], [data-save-points-limit], [data-save-unit], [data-view-unit-detail], [data-close-unit-detail], [data-attach-leader], [data-detach-leader], [data-save-detachment], [data-revalidate-rules]");
    if (!button || !container.contains(button) || busy) return;
    if (button.matches("[data-builder-page]")) { page = button.getAttribute("data-builder-page"); render(); return; }
    if (button.matches("[data-preview-unit]")) { previewId = button.getAttribute("data-preview-unit"); openUnitDetailId = ""; render(); return; }
    if (button.matches("[data-builder-browse]")) { previewId = ""; openUnitDetailId = ""; render(); return; }
    if (button.matches("[data-points-preset]")) { container.querySelector('[name="pointsLimit"]').value = button.getAttribute("data-points-preset"); return; }
    if (button.matches("[data-revalidate-rules]")) {
      await action(async () => {
        if (!current) throw new Error("Open a roster before revalidating it.");
        const result = revalidateRosterRulesData(current, { updatedAt: now() });
        if (result.status !== "current") {
          const details = result.issues?.length ? result.issues.slice(0, 4).join(" ") : "This roster could not be revalidated automatically.";
          throw new Error(details);
        }
        await store.save({ id: result.roster.id, roster: result.roster });
        current = result.roster;
      }, "Roster revalidated against the current tracked rules and points data.");
      return;
    }
    if (button.matches("[data-roster-save]")) {
      const snapshot=structuredClone(current);
      await action(async()=>{ if(!snapshot) throw new Error("Open a list before saving."); snapshot.updatedAt=now(); await store.save({id:snapshot.id,roster:snapshot}); current=snapshot; },"Army list saved."); return;
    }
    if (button.matches("[data-roster-export]")) {
      const url = URL.createObjectURL(new Blob([JSON.stringify(current, null, 2)], {type:"application/json"}));
      const link = document.createElement("a"); link.href=url; link.download="army-list.json"; link.click(); setTimeout(()=>URL.revokeObjectURL(url),1000); return;
    }
    if (button.matches("[data-roster-import]")) {
      const raw = container.querySelector("[data-import-json]")?.value;
      await action(async()=>{ const imported = importArmyRoster(raw, newId, now()); await store.save({roster:imported}); selectedId=imported.id; current=imported; page="editor"; }, "Independent army list imported."); return;
    }
    if (button.matches("[data-add-catalog-unit]")) {
      const catalogId = button.getAttribute("data-add-catalog-unit") || container.querySelector("[data-catalog-unit]")?.value;
      const modelCount = button.getAttribute("data-add-catalog-unit") ? 1 : Math.max(1, Number(container.querySelector('[name="modelCount"]')?.value) || 1);
      await action(async () => {
        if (!current) throw new Error("Open a roster first.");
        const candidate = findArmyUnitCandidates({ faction: current.faction }).find((unit) => unit.id === catalogId);
        if (!candidate) throw new Error("Choose a unit from the catalog first.");
        const resolvedModelCount = modelCount > 1 ? modelCount : (candidate.defaultModelCount ?? modelCount);
        const ruleSet = getTyranidWargearRuleSet(candidate.id);
        const rosterUnit = {
          id: newId(), name: candidate.name, modelCount: resolvedModelCount,
          points: resolveInitialUnitPoints(candidate, resolvedModelCount), pointsOptions: candidate.pointsOptions ?? [], notes: "",
          datasheet: candidate.datasheet ?? null, datasheetId: candidate.id,
          dataSource: { status: candidate.verificationStatus, sourceName: candidate.sourceName, sourceUrl: candidate.sourceUrl,
            reviewedAt: candidate.reviewedAt ?? null, pointsSourceName: candidate.pointsSourceName ?? null,
            pointsSourceUrl: candidate.pointsSourceUrl ?? null, rulesDataRevisionId: candidate.rulesDataRevisionId ?? null,
            officialRulesCrossCheck: candidate.officialRulesCrossCheck ?? "pending" },
          ...(ruleSet ? { loadoutValidation: pendingManualWargearValidation(ruleSet) } : {})
        };
        const updated = { ...current, units: [...current.units, rosterUnit], updatedAt: now() };
        await store.save({ id: updated.id, roster: updated }); current = updated;
      }, "Catalog candidate added. Select and save its reviewed wargear before battle use.");
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
      }, "Leader detached from Bodyguard and roster saved.");
      return;
    }
    if (button.matches("[data-save-unit]")) {
      const unitId = button.getAttribute("data-save-unit");
      let prepared;
      try { prepared=unitEditor.prepareSave(current?.units?.find(unit=>unit.id===unitId)); }
      catch(error) { message=error.message;render();return; }
      await action(async()=>{
        if(!current||!prepared.unit)throw new Error("Open a unit first.");
        let nextUnit=prepared.unit;
        if(prepared.selections){
          const loadout=buildManualWargearLoadout(nextUnit,prepared.selections);
          if(loadout.loadoutValidation.status!=="rules-reviewed-valid")throw new Error(loadout.loadoutValidation.errors.join(" "));
          nextUnit={...nextUnit,...loadout};
        }
        const updated={...current,units:current.units.map(unit=>unit.id===unitId?nextUnit:unit),updatedAt:now()};
        await store.save({id:updated.id,roster:updated});current=updated;unitEditor.reset(unitId);
      },"Unit size, points and selected wargear saved.");return;
    }
    if (button.matches("[data-save-detachment]")) {
      const selected=[...container.querySelectorAll("[data-roster-detachment-checkbox]:checked")].map(input=>input.value);
      await action(async () => {
        if (!current) throw new Error("Open a roster before changing its detachments.");
        const updated = {...normalizeRosterDetachmentSelection(current,selected), updatedAt: now()};
        await store.save({ id: updated.id, roster: updated });
        current = updated;
      }, "Detachments saved to roster.");
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
      const playerId = container.querySelector("[data-roster-player]")?.value;
      const rosterToApply = current;
      await action(async () => {
        if (!rosterToApply || !onApplyRoster) throw new Error("Open a roster before assigning it.");
        if (!playerId) throw new Error("Choose Your army or Opponent army before assigning this roster.");
        const rulesAssessment = assessRosterRulesData(rosterToApply);
        if (rulesAssessment.status === "review-required") {
          throw new Error("This roster's tracked rules data is out of date. Revalidate it before assigning it to a battle.");
        }
        await onApplyRoster(rosterToApply, playerId);
      }, "Roster assigned to the selected side. Its units are now available for deployment planning.");
      return;
    }
    if (button.matches("[data-roster-load]")) {
      const loadId = button.getAttribute("data-roster-load") || container.querySelector("[data-roster-select]")?.value || selectedId;
      await action(async () => {
        selectedId = loadId;
        if (!selectedId) throw new Error("Choose a saved roster first.");
        current = (await store.load(selectedId)).roster; page = "editor"; openUnitDetailId = "";
      }, "Roster loaded.");
      return;
    }
    if (button.matches("[data-roster-rename]")) {
      const name = container.querySelector("[data-roster-name]")?.value?.trim();
      await action(async()=> { if (!name) throw new Error("Enter a list name."); const updated={...current,name,updatedAt:now()}; await store.save({id:updated.id,roster:updated}); current=updated; }, "List name saved."); return;
    }
    if (button.matches("[data-roster-duplicate]")) {
      await action(async () => {
        if (!current) throw new Error("Open a roster first.");
        const name = current.name + " Copy";
        if (name == null) return;
        const timestamp = now();
        const copy = remapRosterUnitIds(
          duplicateArmyRoster(current, { id: newId(), name, createdAt: timestamp, updatedAt: timestamp }),
          { createId: () => newId() }
        );
        await store.save({ roster: copy }); selectedId = copy.id; current = copy;
      }, "Independent roster copy created.");
      return;
    }
    if (button.matches("[data-roster-delete]")) {
      const rosterId=button.getAttribute("data-roster-delete") || current?.id;
      const roster=rosterCache.get(rosterId) ?? (current?.id===rosterId?current:null);
      await action(async () => {
        if (!rosterId) throw new Error("Choose an army list first.");
        if (!window.confirm('Delete "' + (roster?.name ?? "this army list") + '"? This cannot be undone.')) return;
        await store.remove(rosterId); rosterCache.delete(rosterId);
        if(current?.id===rosterId){selectedId="";current=null;page="library";}
      }, "Army list deleted.");
      return;
    }
    if (button.matches("[data-remove-unit]")) {
      await action(async () => {
        if (!current) throw new Error("Open a roster first.");
        const unitId = button.getAttribute("data-remove-unit");
        const updated = removeUnitFromRoster(current, unitId, { updatedAt: now() });
        await store.save({ id: updated.id, roster: updated }); current = updated;
      }, "Unit removed and roster saved.");
    }
  }
  function updateCatalog() {
    const results=container.querySelector("[data-catalog-results]");
    if(results) results.innerHTML=renderCatalogResults({current, unitSearch, category, sort, fits, busy});
  }
  function updateWarhammerImportPreview() {
    const host=container.querySelector("[data-warhammer-import-preview]"); if(!host) return;
    const text=container.querySelector("[data-warhammer-import-text]")?.value??"";
    const faction=container.querySelector("[data-warhammer-faction]")?.value??"";
    if(!text.trim()){host.textContent="Paste the export to preview detected units.";return;}
    try {
      const parsed=importWarhammerAppRoster({text,faction,name:"Preview",pointsLimit:null,id:"preview",createdAt:null});
      const detailed=parsed.roster.units.filter(unit=>unit.datasheet?.characteristics&&unit.datasheet?.weapons?.length).length;
      host.innerHTML=`<strong>${parsed.roster.units.length} detected unit(s) · ${parsed.totalPoints} pts · ${detailed} with stats and weapon profiles</strong><ul>${parsed.roster.units.map(unit=>`<li>${escapeHtml(unit.modelCount)} × ${escapeHtml(unit.name)} · ${escapeHtml(unit.points??"points unknown")} pts${unit.attachedToBodyguardId?" · attached leader":""}${unit.isWarlord?" · Warlord":""}${unit.datasheet?.characteristics&&unit.datasheet?.weapons?.length?"":" · full profile unavailable"}${unit.dataSource.officialRulesCrossCheck==="verified"?"":" · source review pending"}</li>`).join("")}</ul>${parsed.roster.detachment?`<p>Detachment: ${escapeHtml(parsed.roster.detachment)}</p>`:""}${parsed.warnings.map(w=>`<p role="alert">${escapeHtml(w)}</p>`).join("")}${parsed.unrecognized.length?`<p role="alert">${parsed.unrecognized.length} point line(s) were not matched. They will be preserved in the list notes.</p><ul>${parsed.unrecognized.map(line=>`<li>${escapeHtml(line)}</li>`).join("")}</ul>`:""}`;
    } catch(error) {host.textContent=error?.message??String(error);}
  }
  function handleInput(event) {
    if(event.target?.matches?.("[data-warhammer-import-text], [data-warhammer-import] input[name='rosterName'], [data-warhammer-import] input[name='pointsLimit']")) updateWarhammerImportPreview();
    if(event.target?.matches?.("[data-unit-search]")) { unitSearch=event.target.value; updateCatalog(); }
  }
  function handleChange(event) {
    if(!busy&&unitEditor.handleChange(event))return;
    if(event.target?.matches?.("[data-warhammer-faction]")) { updateWarhammerImportPreview(); return; }
    if(event.target?.matches?.("[data-catalog-category]")) { category=event.target.value; updateCatalog(); return; }
    if(event.target?.matches?.("[data-catalog-sort]")) { sort=event.target.value; updateCatalog(); return; }
    if(event.target?.matches?.("[data-catalog-fits]")) { fits=event.target.checked; updateCatalog(); return; }

    if (event.target?.matches?.("[data-roster-create-faction]")) {
      const select = container.querySelector("[data-roster-detachment-select]");
      if (select) select.innerHTML = detachmentOptions(event.target.value, null);
      return;
    }
    if (event.target?.matches?.("[data-roster-select]")) {
      selectedId = event.target.value || "";
      current = null; message = ""; render();
      return;
    }
    if (event.target?.matches?.("[data-catalog-unit]")) {
      const candidate = findArmyUnitCandidates({ faction: current?.faction })
        .find((unit) => unit.id === event.target.value);
      const modelCountInput = container.querySelector('[name="modelCount"]');
      if (candidate?.defaultModelCount && modelCountInput) modelCountInput.value = String(candidate.defaultModelCount);
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
