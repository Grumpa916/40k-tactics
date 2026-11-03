import { renderTargetDefenseReminders } from './rules-reminder-panel.js';
import { createLiveMapView } from './live-map-view.js';
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

export function createFightTabletopScreen(container, { session, perspectivePlayerId = null, gameData = null }) {
  const mapView = createLiveMapView();
  let endReview = false;
  let attackerId = null, weaponId = null, targetId = null, precisionAllocationId = null;
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
    const tabletopOnly = options.attackers.filter(item => item.eligibilitySource === 'tabletop-confirmed');
    const unfinished = options.attackers.filter(item => item.eligibilitySource === 'active');
    const chooseButtons = units => units.map(item => `<button type="button" class="fight-order__unit ${item.ownerId === perspectivePlayerId ? 'is-friendly' : 'is-opponent'}" data-fight-select="${esc(item.unitId)}" aria-pressed="${item.unitId === attackerId}">${esc(item.name)}</button>`).join('');
    const adviceState = !incomingAttackMode && unit && targetId && weaponId ? getFightAdvisorContext(state, gameData) : state;
    let advice = '';
    if (!incomingAttackMode) {
      try { advice = fightAdvisory(attackerId, weaponId, targetId, adviceState, weapons, perspectivePlayerId); }
      catch { advice = '<p>Combat profile incomplete. Check unit details; record the physical result below.</p>'; }
    }
    const unitNameColor = unit ? (unit.ownerId === perspectivePlayerId ? '#79bbff' : '#ff8585') : '';
    const attackControls = `${unit ? `<div class="combat-workspace__damage"><span>Actual damage</span><div><button type="button" data-fight-damage-minus aria-label="Decrease actual damage">−</button><strong data-fight-damage-value>${damage}</strong><button type="button" data-fight-damage-plus aria-label="Increase actual damage">+</button></div></div>
        <button type="button" data-fight-attack ${attackerId && weaponId && targetId ? '' : 'disabled'}>Record weapon attack →</button>` : ''}`;
    const fightsFirstPending = Boolean(unit && !selectedOption?.fightsFirst && model.candidates.fightsFirst.length);
    const controls = `${unitNameColor ? `<style>.combat-workspace[data-combat-phase="fight"] .combat-workspace__panel h1{color:${unitNameColor}}</style>` : ''}<h1>${esc(unit?.name ?? 'Select a fighter')}</h1>

      ${state.phase !== 'fight' ? '<p class="combat-workspace__error" role="status">Viewing Fight. Return to the current game phase and advance to Fight before recording an activation.</p>' : ''}
      ${error ? `<p class="combat-workspace__error" role="alert">${esc(error)}</p>` : ''}
      ${renderTargetDefenseReminders(state, {targetUnitId:targetId,allocationTargetId:precisionAllocationId,attackerId,weapon:selectedWeapon,phase:'fight'})}
      ${renderCustodesKatahPhasePanel(state, { phase: 'fight', unitId: attackerId })}
      <details class="fight-order" ${attackerId ? '' : 'open'}><summary>Fight order · ${available.length} inferred</summary>
        <h3>Fights First · recommended priority</h3><div class="combat-workspace__choices">${chooseButtons(model.candidates.fightsFirst) || '<small>None remaining</small>'}</div>
        <h3>Other inferred combats</h3><div class="combat-workspace__choices">${chooseButtons(model.candidates.normal) || '<small>None remaining</small>'}</div>
        ${tabletopOnly.length ? `<h3>Tabletop-confirmed fighters</h3><div class="combat-workspace__choices">${chooseButtons(tabletopOnly)}</div><small>Use these when the physical table confirms a legal Fight that the saved engagement state did not infer.</small>` : ''}
        ${unfinished.length ? `<h3>Unfinished activations</h3><div class="combat-workspace__choices">${chooseButtons(unfinished)}</div>` : ''}
      </details>
      ${unit ? `<p>${active ? 'Fight activation recorded · add any remaining weapon/target results below.' : 'Choose weapon and target. The first recorded attack begins this activation automatically.'}</p>
        ${fightsFirstPending ? '<section class="combat-workspace__card" role="status"><strong>Fights First still pending</strong><p>The app recommends resolving those units first. If the physical tabletop confirms this activation now, you can still record it here.</p></section>' : ''}
        ${selectedOption?.eligibilitySource === 'tabletop-confirmed' ? '<p><small>Tabletop-confirmed eligibility: this formation was not inferred as engaged by the saved app state. The physical table is authoritative.</small></p>' : ''}
        ${options.overrunAvailable ? '<section class="combat-workspace__card" role="status"><strong>Overrun Fight available</strong><p>This formation charged this turn but has no remaining recorded engagement. On the tabletop, choose an enemy within 5″, make the legal Pile In move of up to 3″ and finish engaged. Then select that enemy below and resolve the Fight normally.</p></section>' : '<p><small>Confirm Fight legality from the tabletop now. Charge targets, Fights First ordering and approximate map position are guidance/context; they do not block recording the physical result.</small></p>'}
        <label>Melee weapon<select data-fight-weapon><option value="">Choose weapon…</option>${weapons.map(weapon => `<option value="${esc(weapon.id)}" ${weapon.id === weaponId ? 'selected' : ''}>${esc(weapon.name)}${weapon.characteristics?.extraAttacks ? ' · Extra Attacks' : ''}</option>`).join('')}</select></label>
        ${weaponNotice ? `<p class="combat-workspace__error" role="status">${esc(weaponNotice)}</p>` : ''}
        ${selectedWeapon?.characteristics?.extraAttacks ? '<p><strong>Extra Attacks:</strong> record this weapon in addition to the model’s main melee weapon during the same activation.</p>' : ''}
        <label>${options.overrunAvailable ? 'Overrun target · confirm within 5″ on tabletop' : 'Target · confirm legal after Pile In'}<select data-fight-target><option value="">Choose target…</option>${options.targets.map(target => `<option value="${esc(target.unitId)}" ${target.unitId === targetId ? 'selected' : ''}>${esc(target.name)}</option>`).join('')}</select></label>
        ${precisionOptions.length ? `<label>Precision allocation · optional<select data-fight-precision><option value="">Normal allocation</option>${precisionOptions.map(option => `<option value="${esc(option.unitId)}" ${option.unitId === precisionAllocationId ? 'selected' : ''}>${esc(option.name)}</option>`).join('')}</select><small>Choose an attached Leader only if you allocated this Precision weapon’s wounds to that Character on the tabletop.</small></label>` : ''}
        ${!options.targets.length ? '<p>No deployed enemy formations remain.</p>' : ''}
        <div class="combat-workspace__choices">${!active ? '<button type="button" data-fight-skip>Do not fight</button>' : '<button type="button" data-fight-finish-entry>Finish activation</button>'}</div>` : ''}
      <aside class="combat-workspace__card combat-workspace__advisor" aria-label="${incomingAttackMode ? 'Incoming damage estimate' : 'Fight Tactical Advisor'}"><h2>${incomingAttackMode ? 'Incoming attack' : 'Tactical Advisor'}</h2>
        ${incomingAttackMode
          ? renderIncomingDamageForecast(state, { attackerId, targetId, weapon: selectedWeapon })
          : advice || '<p>Select a fighter, melee weapon and target to compare expected damage and return damage.</p>'}
        ${incomingAttackMode ? '' : '<details data-view-key="fight-assumptions"><summary>Advisor assumptions</summary><p>Uses known weapon profiles, wounds and the fighter/target you confirm from the physical tabletop. Fight order, Charge history and approximate map position provide tactical context but do not determine what you are allowed to record. Return damage is the strongest known eligible retaliation estimate across possible target survival outcomes, not the sum of every enemy attack. A dash means no response estimate is established, not guaranteed safety. Unknown profiles or abilities can change the result.</p></details>'}
      </aside>
      <details data-view-key="fight-history"><summary>Phase history · ${model.attacks.length} attacks</summary><ol>${model.attacks.map(attack => `<li>${esc(state.units.find(unit => unit.id === attack.attackerId)?.name)} → ${esc(attack.allocationTargetName ? `${state.units.find(unit => unit.id === attack.targetId)?.name} (${attack.allocationTargetName})` : state.units.find(unit => unit.id === attack.targetId)?.name)} · ${esc(attack.actualDamage ?? attack.totalDamage)} damage</li>`).join('')}</ol><small>${model.activations.length} unit choices recorded</small></details>`;
    const endPrompt = endReview ? `<section class="combat-end-review" role="region" aria-label="End Fight confirmation"><strong>End Fight?</strong><p>Close all open activations.${available.length ? ' Record these remaining inferred combats as not fighting: ' + available.map(item => esc(item.name)).join(', ') + '.' : ''}</p><button type="button" data-fight-confirm-end>Confirm · End Fight</button><button type="button" data-fight-cancel-end>Keep fighting</button></section>` : '';
    container.innerHTML = renderCombatWorkspace({ state, mapView, phase:'fight', perspectivePlayerId:perspectivePlayerId ?? state.activePlayer, selectedUnitId:attackerId, controls, footer:`${renderActionReceipt(session)}${attackControls}${endPrompt}<button type="button" data-fight-complete ${state.phase === 'fight' ? '' : 'disabled'}>End Fight · Review remaining →</button>` });

    restoreView();
    mapView.bind(container);
    bindCustodesKatahActions(container, session, message => { error = message; }, render);
    const choose = id => {
      if (!options.attackers.some(unit => unit.unitId === id)) {
        error = isCombatActivationFinished(state, id, 'fight') ? 'This unit has finished its Fight activation this turn.' : 'This unit is not available as a separate deployed Fight formation.'; render(); return;
      }
      if (id !== attackerId) { reset(); attackerId = id; }
      error = ''; render();
    };
    const chooseTarget = id => { targetId = id; precisionAllocationId = null; damage = 0; error = ''; render(); };
    bindCombatMap(container, { selectedUnitId:attackerId, targetIds:targetId ? [targetId] : [], selectableIds:[...options.attackers.map(unit => unit.unitId), ...options.targets.map(unit => unit.unitId)], onSelect:id => {
      if (attackerId && options.targets.some(unit => unit.unitId === id)) chooseTarget(id);
      else choose(id);
    } });
    container.querySelectorAll('[data-fight-select]').forEach(button => button.addEventListener('click', () => choose(button.getAttribute('data-fight-select'))));
    container.querySelector('[data-fight-weapon]')?.addEventListener('change', event => { weaponId = event.target.value || null; precisionAllocationId = null; damage = 0; error = ''; render(); });
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
  const unsubscribe = session.subscribe(render);
  render();
  return { getState:session.getState, render, requestPhaseEnd, destroy:() => { unsubscribe(); container.replaceChildren(); } };
}
