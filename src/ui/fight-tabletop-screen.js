import { renderPhaseSelectedVitals } from './phase-selected-vitals.js';
import { renderTargetDefenseReminders } from './rules-reminder-panel.js';
import { renderFightTargetRuleStatus } from './fight-target-rule-status.js';
import { createLiveMapView } from './live-map-view.js';
import { bindLiveMapPositionCorrection } from './live-map-position-correction.js';
import { captureViewContinuity } from './view-continuity.js';
import { renderActionReceipt } from './action-receipt.js';
import { finishCombatUnit } from '../application/combat-activation-workflow.js';
import { isCombatActivationFinished } from '../rules/combat-activation-state.js';
import { getPrecisionAllocationOptions } from '../rules/precision-allocation.js';
import { getBattleRosterUnit, getBattleUnitDatasheet } from '../rules/battle-unit-reference.js';
import { getFightViewModel, getFightAttackOptions, getFightWeaponOptions, activateFightUnit, resolveFightAttack, finishFightPhase } from '../application/fight-workflow.js';
import { getFightAdvisorContext } from '../application/fight-advisor-context.js';
import { fightAdvisory } from './fight-advisor.js';
import { renderCombatWorkspace, bindCombatMap, escapeHtml as esc } from './combat-workspace.js';
import { renderCustodesKatahPhasePanel, bindCustodesKatahActions } from './custodes-katah-panel.js';
import { renderIncomingDamageForecast } from './incoming-damage-forecast-view.js';

export function createFightTabletopScreen(container, { session, perspectivePlayerId = null, gameData = null, unitSelection = null }) {
  const mapView = createLiveMapView();
  let endReview = false;
  let attackerId = unitSelection?.get(session.getState()) ?? null, weaponId = null, targetId = null, precisionAllocationId = null;
  let damage = 0, error = '', dispatching = false;
  const reset = () => { attackerId = weaponId = targetId = precisionAllocationId = null; damage = 0; };

  function render() {
    if (dispatching) return;
    const restoreView = captureViewContinuity(container);
    const state = session.getState();
    const model = getFightViewModel(state, { perspectivePlayerId });
    const viewingPlayerId = perspectivePlayerId ?? state.players?.[0]?.id ?? state.activePlayer;
    let options = getFightAttackOptions(state, { attackerId, perspectivePlayerId, includeCandidates:true });
    if (!options.attackers.some(unit => unit.unitId === attackerId)) reset();
    options = getFightAttackOptions(state, { attackerId, perspectivePlayerId, includeCandidates:true });
    const weapons = getFightWeaponOptions(state, { attackerId, gameData });
    if (!weapons.some(weapon => weapon.id === weaponId)) weaponId = weapons.length === 1 ? weapons[0].id : null;
    if (!options.targets.some(unit => unit.unitId === targetId)) { targetId = null; precisionAllocationId = null; }
    const selectedWeapon = weapons.find(weapon => weapon.id === weaponId) ?? null;
    const precisionOptions = selectedWeapon?.characteristics?.precision === true && targetId
      ? getPrecisionAllocationOptions(state, targetId)
      : [];
    if (!precisionOptions.some(option => option.unitId === precisionAllocationId)) precisionAllocationId = null;
    const unit = state.units.find(unit => unit.id === attackerId);
    const selectedOption = options.attackers.find(item => item.unitId === attackerId) ?? null;
    const incomingAttackMode = Boolean(unit && unit.ownerId !== viewingPlayerId);
    const rosterUnit = unit ? getBattleRosterUnit(state, unit) : null;
    const loadout = rosterUnit?.loadoutValidation;
    const weaponNotice = unit && !weapons.length
      ? ['source-invalid', 'rules-invalid', 'manual-selection-required', 'unverified'].includes(loadout?.status)
        ? `No melee weapon is available because ${unit.name}'s saved wargear needs review. ${loadout.errors?.join(' ') || 'Review this unit’s equipment in the army roster.'}`
        : getBattleUnitDatasheet(state, unit)?.weapons?.length
          ? `No melee weapon profile is available for ${unit.name}'s saved equipment. Review this unit’s wargear in the army roster.`
          : `No combat datasheet was found for ${unit.name}. Review this unit in the army roster.`
      : '';
    const active = model.activations.some(item => item.unitId === attackerId && item.actionType !== 'not_fight');
    const available = [...model.candidates.fightsFirst, ...model.candidates.normal];
    const unfinished = options.attackers.filter(item => item.eligibilitySource === 'active');
    const fightsFirstIds = new Set(model.candidates.fightsFirst.map(item => item.unitId));
    const unfinishedIds = new Set(unfinished.map(item => item.unitId).filter(id => !fightsFirstIds.has(id)));
    const otherIds = new Set(model.candidates.normal.map(item => item.unitId)
      .filter(id => !fightsFirstIds.has(id) && !unfinishedIds.has(id)));
    const rosterSections = [
      { label:'Fights First', unitIds:fightsFirstIds },
      { label:'Unfinished activations', unitIds:unfinishedIds },
      { label:'Other eligible fighters', unitIds:otherIds }
    ];
    const adviceState = !incomingAttackMode && unit && targetId && weaponId ? getFightAdvisorContext(state, gameData) : state;
    let advice = '';
    if (!incomingAttackMode) {
      try { advice = fightAdvisory(attackerId, weaponId, targetId, adviceState, weapons, perspectivePlayerId, { compact:true }); }
      catch { advice = '<p>Combat profile incomplete. Check unit details; record the physical result below.</p>'; }
    }
    const unitNameColor = unit ? (unit.ownerId === perspectivePlayerId ? '#79bbff' : '#ff8585') : '';
    const attackControls = `${unit ? `<div class="combat-workspace__damage"><span>Actual damage</span><div><button type="button" data-fight-damage-minus aria-label="Decrease actual damage">−</button><strong data-fight-damage-value>${damage}</strong><button type="button" data-fight-damage-plus aria-label="Increase actual damage">+</button></div></div>
        <button type="button" data-fight-attack ${attackerId && weaponId && targetId ? '' : 'disabled'}>Record weapon attack →</button>` : ''}`;
    const fightsFirstPending = Boolean(unit && !selectedOption?.fightsFirst && model.candidates.fightsFirst.length);
    const controls = `${unitNameColor ? `<style>.combat-workspace[data-combat-phase="fight"] .combat-workspace__panel h1{color:${unitNameColor}}</style>` : ''}<h1>${esc(unit?.name ?? 'Select a fighter')}</h1>

      ${state.phase === 'fight' ? renderPhaseSelectedVitals(state,attackerId) : ''}
      ${state.phase !== 'fight' ? '<p class="combat-workspace__error" role="status">Viewing Fight. Return to the current game phase and advance to Fight before recording an activation.</p>' : ''}
      ${error ? `<p class="combat-workspace__error" role="alert">${esc(error)}</p>` : ''}
      ${renderTargetDefenseReminders(state, {targetUnitId:targetId,allocationTargetId:precisionAllocationId,attackerId,weapon:selectedWeapon,phase:'fight',viewingPlayerId})}
      ${renderCustodesKatahPhasePanel(state, { phase: 'fight', unitId: attackerId, playerId: viewingPlayerId })}
      ${!unit ? `<p>Choose a fighter on the map or open Units · ${fightsFirstIds.size} Fights First · ${unfinishedIds.size} unfinished.</p>` : ''}
      ${unit ? `        ${fightsFirstPending ? '<section class="combat-workspace__card" role="status"><strong>Fights First still pending</strong><p>The app recommends resolving those units first. If the physical tabletop confirms this activation now, you can still record it here.</p></section>' : ''}
        ${selectedOption?.eligibilitySource === 'tabletop-confirmed' ? '<p><small>Tabletop-confirmed eligibility: this formation was not inferred as engaged by the saved app state. The physical table is authoritative.</small></p>' : ''}
        ${options.overrunAvailable ? '<section class="combat-workspace__card" role="status"><strong>Overrun Fight available</strong><p>This formation charged this turn but has no remaining recorded engagement. On the tabletop, choose an enemy within 5″, make the legal Pile In move of up to 3″ and finish engaged. Then select that enemy below and resolve the Fight normally.</p></section>' : ''}
        <div class="combat-workspace__weapon-choice-set" role="group" aria-label="Melee weapon">
          <strong>Melee weapon</strong>
          <div class="combat-workspace__weapon-choices">${weapons.map(weapon => `<button type="button" data-fight-weapon-choice="${esc(weapon.id)}" aria-pressed="${String(weapon.id === weaponId)}">${esc(weapon.name)}${weapon.characteristics?.extraAttacks ? ' · Extra Attacks' : ''}</button>`).join('')}</div>
        </div>
        ${weaponNotice ? `<p class="combat-workspace__error" role="status">${esc(weaponNotice)}</p>` : ''}
        ${selectedWeapon?.characteristics?.extraAttacks ? '<p><strong>Extra Attacks:</strong> record this weapon in addition to the model’s main melee weapon during the same activation.</p>' : ''}
        <label>${options.overrunAvailable ? 'Overrun target · confirm within 5″ on tabletop' : 'Target · confirm legal after Pile In'}<select data-fight-target><option value="">Choose target…</option>${options.targets.map(target => `<option value="${esc(target.unitId)}" ${target.unitId === targetId ? 'selected' : ''}>${esc(target.name)}</option>`).join('')}</select></label>
        ${renderFightTargetRuleStatus(state, { attackerId, targetId })}
        ${precisionOptions.length ? `<label>Precision allocation · optional<select data-fight-precision><option value="">Normal allocation</option>${precisionOptions.map(option => `<option value="${esc(option.unitId)}" ${option.unitId === precisionAllocationId ? 'selected' : ''}>${esc(option.name)}</option>`).join('')}</select><small>Choose an attached Leader only if you allocated this Precision weapon’s wounds to that Character on the tabletop.</small></label>` : ''}
        ${!options.targets.length ? '<p>No deployed enemy formations remain.</p>' : ''}
        ${!active ? '<div class="combat-workspace__choices"><button type="button" data-fight-skip>Do not fight</button></div>' : ''}` : ''}
      <aside class="combat-workspace__card combat-workspace__advisor" aria-label="${incomingAttackMode ? 'Incoming damage estimate' : 'Fight Tactical Advisor'}"><h2>${incomingAttackMode ? 'Incoming attack' : 'Tactical Advisor'}</h2>
        ${incomingAttackMode
          ? renderIncomingDamageForecast(state, { attackerId, targetId, weapon: selectedWeapon })
          : advice || '<p>Select a fighter, melee weapon and target to compare expected damage and return damage.</p>'}
      </aside>
      <details data-view-key="fight-history"><summary>Phase history · ${model.attacks.length} attacks</summary><ol>${model.attacks.map(attack => `<li>${esc(state.units.find(unit => unit.id === attack.attackerId)?.name)} → ${esc(attack.allocationTargetName ? `${state.units.find(unit => unit.id === attack.targetId)?.name} (${attack.allocationTargetName})` : state.units.find(unit => unit.id === attack.targetId)?.name)} · ${esc(attack.actualDamage ?? attack.totalDamage)} damage</li>`).join('')}</ol><small>${model.activations.length} unit choices recorded</small></details>`;
    const endPrompt = endReview ? `<section class="combat-end-review" role="region" aria-label="End Fight confirmation"><strong>End Fight?</strong><p>Close all open activations.${available.length ? ' Record these remaining inferred combats as not fighting: ' + available.map(item => esc(item.name)).join(', ') + '.' : ''}</p><button type="button" data-fight-confirm-end>Confirm · End Fight</button><button type="button" data-fight-cancel-end>Keep fighting</button></section>` : '';
    const finishUnitControl = active && unit ? '<button type="button" data-fight-finish-entry>Finish unit</button>' : '';
    const endFightControl = active && unit || endReview ? '' : `<button type="button" data-fight-complete ${state.phase === 'fight' ? '' : 'disabled'}>End Fight · Review remaining →</button>`;
    const selectableIds = [...options.attackers, ...options.targets].map(unit => unit.unitId);
    const targetIds = targetId ? [targetId] : [];
    container.innerHTML = renderCombatWorkspace({
      state, mapView, phase:'fight', perspectivePlayerId:perspectivePlayerId ?? state.activePlayer,
      selectedUnitId:attackerId, selectableIds, targetIds, rosterSections, reminderUnitId:incomingAttackMode?targetId:attackerId, controls,
      adaptiveContext:{targetId},
      footer:`${renderActionReceipt(session, { compact:true })}${attackControls}${finishUnitControl}${endPrompt}${endFightControl}`
    });

    restoreView();
    mapView.bind(container, undefined, undefined, session);
    bindCustodesKatahActions(container, session, message => { error = message; }, render);
    const choose = id => {
      if (!options.attackers.some(unit => unit.unitId === id)) {
        const skipped = model.activations.some(item => item.unitId === id && item.actionType === 'not_fight');
        error = skipped || isCombatActivationFinished(state, id, 'fight') ? 'This unit has finished its Fight activation this turn.' : 'This unit is not available as a separate deployed Fight formation.'; render(); return;
      }
      if (id !== attackerId) { reset(); attackerId = id; }
      unitSelection?.select(state, id);
      error = ''; render();
    };
    const chooseTarget = id => { targetId = id; precisionAllocationId = null; damage = 0; error = ''; render(); };
    bindCombatMap(container, { state, selectedUnitId:attackerId, targetIds, selectableIds, onSelect:id => {
      if (attackerId && options.targets.some(unit => unit.unitId === id)) chooseTarget(id);
      else choose(id);
    } });
    container.querySelectorAll('[data-fight-weapon-choice]').forEach(button => button.addEventListener('click', () => {
      const choice = button.getAttribute('data-fight-weapon-choice');
      if (!weapons.some(weapon => weapon.id === choice)) return;
      weaponId = choice; precisionAllocationId = null; damage = 0; error = ''; render();
    }));
    container.querySelector('[data-fight-target]')?.addEventListener('change', event => chooseTarget(event.target.value || null));
    container.querySelector('[data-fight-precision]')?.addEventListener('change', event => { precisionAllocationId = event.target.value || null; damage = 0; error = ''; render(); });
    const skip = () => {
      if (!attackerId || active) return;
      try {
        dispatching = true;
        activateFightUnit(session, { unitId:attackerId, actionType:'not_fight', tabletopConfirmed:true });
        reset();
        error = '';
      } catch (cause) { error = cause?.message ?? String(cause); }
      finally { dispatching = false; }
      render();
    };
    container.querySelector('[data-fight-skip]')?.addEventListener('click', skip);
    container.querySelector('[data-fight-finish-entry]')?.addEventListener('click', () => {
      try { dispatching = true; finishCombatUnit(session, attackerId); reset(); error = ''; }
      catch (cause) { error = cause?.message ?? String(cause); }
      finally { dispatching = false; }
      render();
    });
    for (const [selector, delta] of [['[data-fight-damage-minus]', -1], ['[data-fight-damage-plus]', 1]]) {
      container.querySelector(selector)?.addEventListener('click', () => { damage = Math.max(0, damage + delta); const value = container.querySelector('[data-fight-damage-value]'); if (value) value.textContent = damage; });
    }
    container.querySelector('[data-fight-attack]')?.addEventListener('click', () => {
      const weapon = weapons.find(item => item.id === weaponId);
      if (!attackerId || !targetId || !weapon) return;
      try {
        dispatching = true;
        if (!active) activateFightUnit(session, { unitId:attackerId, actionType:'fight', tabletopConfirmed:true });
        resolveFightAttack(session, { attackerId, targetId, allocationTargetId: precisionAllocationId, weapon, actualDamage:damage });
        targetId = null; precisionAllocationId = null; damage = 0; error = '';
      } catch (cause) { error = cause?.message ?? String(cause); }
      finally { dispatching = false; }
      render();
    });
    container.querySelector('[data-fight-complete]')?.addEventListener('click', requestPhaseEnd);
    container.querySelector('[data-fight-cancel-end]')?.addEventListener('click', () => { endReview = false; render(); });
    container.querySelector('[data-fight-confirm-end]')?.addEventListener('click', () => {
      try { endReview = false; finishFightPhase(session, { confirmRemaining:true }); }
      catch (cause) { error = cause?.message ?? String(cause); render(); }
    });
    return model;
  }
  function requestPhaseEnd() {
    endReview = true; error = ''; render();
    container.querySelector('[data-fight-confirm-end]')?.focus?.();
  }
  const unbindMapCorrection = bindLiveMapPositionCorrection(container, session,
    { phase:"fight", onError:message => { error = message; render(); } });
  const unsubscribe = session.subscribe(render);
  render();
  return { getState:session.getState, render, requestPhaseEnd, destroy:() => { unsubscribe(); unbindMapCorrection(); container.replaceChildren(); } };
}
