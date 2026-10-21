import { getFightViewModel, getFightAttackOptions, getFightWeaponOptions, activateFightUnit, resolveFightAttack, finishFightPhase } from '../application/fight-workflow.js';
import { getFightAdvisorContext } from '../application/fight-advisor-context.js';
import { fightAdvisory } from './fight-advisor.js';
import { renderCombatWorkspace, bindCombatMap, escapeHtml as esc } from './combat-workspace.js';

export function createFightTabletopScreen(container, { session, perspectivePlayerId = null, gameData = null }) {
  let attackerId = null, weaponId = null, targetId = null;
  let damage = 0, error = '', dispatching = false;
  const reset = () => { attackerId = weaponId = targetId = null; damage = 0; };

  function render() {
    if (dispatching) return;
    const state = session.getState();
    const model = getFightViewModel(state, { perspectivePlayerId });
    let options = getFightAttackOptions(state, { attackerId, perspectivePlayerId, includeCandidates:true });
    if (!options.attackers.some(unit => unit.unitId === attackerId)) reset();
    options = getFightAttackOptions(state, { attackerId, perspectivePlayerId, includeCandidates:true });
    const weapons = getFightWeaponOptions(state, { attackerId, gameData });
    if (!weapons.some(weapon => weapon.id === weaponId)) weaponId = weapons.length === 1 ? weapons[0].id : null;
    if (!options.targets.some(unit => unit.unitId === targetId)) targetId = null;
    const unit = state.units.find(unit => unit.id === attackerId);
    const active = model.activations.some(item => item.unitId === attackerId && item.actionType !== 'not_fight');
    const available = [...model.candidates.fightsFirst, ...model.candidates.normal];
    const chooseButtons = (units, blocked = false) => units.map(item => `<button type="button" data-fight-select="${esc(item.unitId)}" aria-pressed="${item.unitId === attackerId}" ${blocked ? 'disabled' : ''}>${esc(item.name)} · ${item.ownerId === perspectivePlayerId ? 'You' : 'Opponent'}</button>`).join('');
    const adviceState = unit && targetId && weaponId ? getFightAdvisorContext(state, gameData) : state;
    let advice = '';
    try { advice = fightAdvisory(attackerId, weaponId, targetId, adviceState, weapons, perspectivePlayerId); }
    catch { advice = '<p>Combat profile incomplete. Check unit details; record the physical result below.</p>'; }
    const controls = `<h1>${esc(unit?.name ?? 'Select a fighter')}</h1>
      <p>Round ${esc(model.round)} · ${model.candidates.fightsFirst.length ? 'Fights First' : 'Remaining combats'} · either army</p>
      <small>Follow tabletop activation order. The app enforces Fights First priority; alternating players remains a table-side decision.</small>
      ${state.phase !== 'fight' ? '<p class="combat-workspace__error" role="status">Viewing Fight. Return to the current game phase and advance to Fight before recording an activation.</p>' : ''}
      ${error ? `<p class="combat-workspace__error" role="alert">${esc(error)}</p>` : ''}
      <details ${attackerId ? '' : 'open'}><summary>Fighters · ${available.length} available</summary>
        <h3>Fights First</h3><div class="combat-workspace__choices">${chooseButtons(model.candidates.fightsFirst) || '<small>None remaining</small>'}</div>
        <h3>Remaining combats</h3><div class="combat-workspace__choices">${chooseButtons(model.candidates.normal, model.candidates.fightsFirst.length > 0) || '<small>None remaining</small>'}</div>
        ${model.activations.some(item => item.actionType !== 'not_fight') ? `<h3>Continue attack entry</h3><div class="combat-workspace__choices">${chooseButtons(options.attackers.filter(item => !available.some(c => c.unitId === item.unitId)))}</div>` : ''}
      </details>
      ${unit ? `<p>${active ? 'Fight activation recorded · add weapon/target results below.' : 'Compare targets, then record the first attack to begin this activation.'}</p>
        <label>Melee weapon<select data-fight-weapon><option value="">Choose weapon…</option>${weapons.map(weapon => `<option value="${esc(weapon.id)}" ${weapon.id === weaponId ? 'selected' : ''}>${esc(weapon.name)}</option>`).join('')}</select></label>
        <label>Target · tap an enemy marker<select data-fight-target><option value="">Choose target…</option>${options.targets.map(target => `<option value="${esc(target.unitId)}" ${target.unitId === targetId ? 'selected' : ''}>${esc(target.name)}</option>`).join('')}</select></label>
        ${!options.targets.length ? '<p>No eligible targets remain in the recorded engagement context.</p>' : ''}
        <div class="combat-workspace__choices">${!active ? '<button type="button" data-fight-begin>Begin Fight</button><button type="button" data-fight-skip>Do not fight</button>' : '<button type="button" data-fight-finish-entry>Finish unit entry</button>'}</div>` : '<p>Tap a fighter, then an enemy. Target comparison does not record an activation.</p>'}
      <aside class="combat-workspace__card combat-workspace__advisor" aria-label="Fight Tactical Advisor"><h2>Tactical Advisor</h2>
        ${advice || '<p>Select a fighter, melee weapon and target to compare expected damage and return damage.</p>'}
        <details><summary>Advisor assumptions</summary><p>Uses known weapon profiles, wounds and recorded engagements. Return damage is the strongest known eligible retaliation estimate across possible target survival outcomes, not the sum of every enemy attack. Unknown profiles or abilities can change the result.</p></details>
      </aside>
      ${unit ? `<div class="combat-workspace__damage"><span>Actual damage</span><div><button type="button" data-fight-damage-minus aria-label="Decrease actual damage">−</button><strong data-fight-damage-value>${damage}</strong><button type="button" data-fight-damage-plus aria-label="Increase actual damage">+</button></div></div>
        <button type="button" data-fight-attack ${attackerId && weaponId && targetId ? '' : 'disabled'}>Record weapon attack →</button><p>Record another weapon or target within this activation as needed.</p>` : ''}
      <details><summary>Phase history · ${model.attacks.length} attacks</summary><ol>${model.attacks.map(attack => `<li>${esc(state.units.find(unit => unit.id === attack.attackerId)?.name)} → ${esc(state.units.find(unit => unit.id === attack.targetId)?.name)} · ${esc(attack.actualDamage ?? attack.totalDamage)} damage</li>`).join('')}</ol><small>${model.activations.length} unit choices recorded</small></details>`;
    container.innerHTML = renderCombatWorkspace({ state, phase:'fight', perspectivePlayerId:perspectivePlayerId ?? state.activePlayer, selectedUnitId:attackerId, controls, footer:`<button type="button" data-fight-complete ${model.canComplete ? '' : 'disabled'}>End Fight · Review turn →</button>` });

    const choose = id => {
      if (!options.attackers.some(unit => unit.unitId === id)) {
        error = 'This unit cannot begin a Fight activation yet. Resolve remaining Fights First units and confirm eligibility.'; render(); return;
      }
      if (id !== attackerId) { reset(); attackerId = id; }
      error = ''; render();
    };
    const chooseTarget = id => { targetId = id; damage = 0; error = ''; render(); };
    bindCombatMap(container, { selectedUnitId:attackerId, targetIds:targetId ? [targetId] : [], selectableIds:options.attackers.map(unit => unit.unitId), onSelect:id => {
      if (attackerId && options.targets.some(unit => unit.unitId === id)) chooseTarget(id);
      else choose(id);
    } });
    container.querySelectorAll('[data-fight-select]').forEach(button => button.addEventListener('click', () => choose(button.getAttribute('data-fight-select'))));
    container.querySelector('[data-fight-weapon]')?.addEventListener('change', event => { weaponId = event.target.value || null; damage = 0; error = ''; render(); });
    container.querySelector('[data-fight-target]')?.addEventListener('change', event => chooseTarget(event.target.value || null));
    const begin = (actionType = 'fight') => {
      if (!attackerId || active) return;
      try {
        dispatching = true;
        activateFightUnit(session, { unitId:attackerId, actionType });
        if (actionType === 'not_fight') reset();
        error = '';
      } catch (cause) { error = cause?.message ?? String(cause); }
      finally { dispatching = false; }
      render();
    };
    container.querySelector('[data-fight-begin]')?.addEventListener('click', () => begin());
    container.querySelector('[data-fight-skip]')?.addEventListener('click', () => begin('not_fight'));
    container.querySelector('[data-fight-finish-entry]')?.addEventListener('click', () => { reset(); error = ''; render(); });
    for (const [selector, delta] of [['[data-fight-damage-minus]', -1], ['[data-fight-damage-plus]', 1]]) {
      container.querySelector(selector)?.addEventListener('click', () => { damage = Math.max(0, damage + delta); const value = container.querySelector('[data-fight-damage-value]'); if (value) value.textContent = damage; });
    }
    container.querySelector('[data-fight-attack]')?.addEventListener('click', () => {
      const weapon = weapons.find(item => item.id === weaponId);
      if (!attackerId || !targetId || !weapon) return;
      try {
        dispatching = true;
        if (!active) activateFightUnit(session, { unitId:attackerId, actionType:'fight' });
        resolveFightAttack(session, { attackerId, targetId, weapon, actualDamage:damage });
        targetId = null; damage = 0; error = '';
      } catch (cause) { error = cause?.message ?? String(cause); }
      finally { dispatching = false; }
      render();
    });
    container.querySelector('[data-fight-complete]')?.addEventListener('click', () => {
      try { finishFightPhase(session); } catch (cause) { error = cause?.message ?? String(cause); render(); }
    });
    return model;
  }
  const unsubscribe = session.subscribe(render);
  render();
  return { getState:session.getState, render, destroy:() => { unsubscribe(); container.replaceChildren(); } };
}
