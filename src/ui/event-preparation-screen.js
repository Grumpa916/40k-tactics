import { createBattleSetupScreen } from './battle-setup-screen.js';
import { createDeploymentScreen } from './deployment-screen.js';
import { PREPARATION_STEPS, preparationStep, preparationIssues, deploymentUnits, formationFor, reserveSummary } from '../rules/event-preparation.js';
import { COMMAND_TYPES } from '../commands/game-commands.js';
const esc = value => String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');

function formationsMarkup(state, stage) {
  const editable = ['formations','redeployment','pre-battle'].includes(stage);
  if (!editable) return '';
  return '<section><h3>' + (stage === 'formations' ? 'Revealed formations' : 'Rule-authorised reserve changes') + '</h3>' +
    '<p>Transport choices require tabletop confirmation of the Transport keyword, passenger eligibility and whole-unit capacity. Linked Leaders/Support follow their bodyguard.</p>' +
    (state.players ?? []).map(p => {
      const units = deploymentUnits(state).filter(u => u.ownerId === p.id);
      const summary = reserveSummary(state,p.id);
      return '<fieldset><legend>'+esc(p.name)+'</legend>' + units.map(u => {
        const f = formationFor(state,u);
        if (stage !== 'formations' && f.kind === 'embarked') return '<p>'+esc(u.name)+' · Embarked in '+esc(state.units.find(x=>x.id===f.transportId)?.name)+'</p>';
        return '<div class="prep-unit"><strong>'+esc(u.name)+'</strong><select aria-label="Location for '+esc(u.name)+'" data-prep-location="'+esc(u.id)+'">'+
          ['field','reserve',...(stage === 'formations' ? ['embarked'] : [])].map(k => '<option value="'+k+'"'+(f.kind===k?' selected':'')+'>'+({field:'Battlefield',reserve:'Strategic reserves',embarked:'Embarked'})[k]+'</option>').join('')+'</select>'+
          (f.kind === 'embarked' ? '<span>Transport: '+esc(state.units.find(x=>x.id===f.transportId)?.name)+'</span>' : '')+
          (stage === 'formations' ? '<select aria-label="Transport for '+esc(u.name)+'" data-prep-transport="'+esc(u.id)+'"><option value="">Assign transport…</option>'+units.filter(t=>t.id!==u.id && formationFor(state,t).kind!=='embarked').map(t=>'<option value="'+esc(t.id)+'"'+(t.id===f.transportId?' selected':'')+'>'+esc(t.name)+'</option>').join('')+'</select>' : '')+'</div>';
      }).join('') + (stage === 'formations' ? '<p>Initial reserves: '+summary.points+' known points'+(summary.unknown?' + '+summary.unknown+' unknown costs':'')+' / '+(summary.limit??'unknown')+' allowed.</p>'+
      ((summary.count && (summary.unknown || summary.limit == null || summary.points > summary.limit)) ? '<label>Tabletop total / rule exception<input data-prep-reserve-note="'+esc(p.id)+'" value="'+esc(state.preparation?.reserveReview?.[p.id]??'')+'" placeholder="Record verified total or named exception"></label><button type="button" data-prep-review="'+esc(p.id)+'">Confirm reserve review</button>' : '') : '')+'</fieldset>';
    }).join('')+'</section>';
}

/** Shared setup/deployment controller; existing map renderer remains untouched. */
export function createEventPreparationScreen(container, options = {}) {
  const { session } = options;
  let child = null, message = '', destroyed = false;
  function send(payload) {
    try { message=''; session.dispatch({type:COMMAND_TYPES.UPDATE_PREPARATION,payload}); }
    catch(e) { message=e.message; render(); }
  }
  function render() {
    if (destroyed) return;
    child?.destroy(); child=null;
    const state=session.getState(), id=preparationStep(state);
    const step=PREPARATION_STEPS.find(x=>x.id===id), index=PREPARATION_STEPS.indexOf(step);
    const legacy = !state.preparation && state.battle?.status === 'deployment';
    const issues=preparationIssues(state);
    container.innerHTML='<main class="event-preparation"><style>.event-preparation button,.event-preparation select,.event-preparation input{min-height:44px;max-width:100%;font:inherit}.event-preparation fieldset{margin:12px 0;min-width:0}.prep-unit{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:8px 0}.prep-unit strong{flex:1;min-width:150px}.prep-actions{display:flex;gap:12px;flex-wrap:wrap;padding:16px 0}.event-preparation progress{width:100%}.event-preparation [data-prep-child]{min-width:0}</style>'+
      '<p>Event Companion v1.2 · '+(index+1)+' / '+PREPARATION_STEPS.length+'</p><progress max="'+PREPARATION_STEPS.length+'" value="'+index+'"></progress><h1>'+esc(step.title)+'</h1><p>'+esc(step.detail)+'</p>'+
      (id==='mission'?'<p>For events, use the Force Dispositions already submitted with the rosters. Leader and Support attachments are part of army mustering.</p>':'')+
      '<div data-prep-child></div>'+formationsMarkup(state,id)+
      (id==='first-turn'?'<div role="group" aria-label="First-turn roll winner">'+state.players.map(p=>'<button type="button" data-prep-first="'+esc(p.id)+'" aria-pressed="'+String(p.id===state.preparation?.firstPlayerId)+'">'+esc(p.name)+'</button>').join('')+'</div>':'')+
      (issues.length?'<ul>'+issues.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>':'')+
      '<p role="status">'+esc(message)+'</p><div class="prep-actions">'+(index>0&&index<5?'<button type="button" data-prep-back>Back — revise previous step</button>':'')+
      (legacy ? '<p>This older deployment save needs the new setup checkpoints reviewed. Existing placements will be retained.</p><button type="button" data-prep-legacy>Review setup checkpoints</button>' : '')+
      '<button type="button" data-prep-next'+(issues.length || legacy?' disabled':'')+'>'+(id==='ready'?'Begin battle':id==='deployment'?'Confirm both armies deployed':id==='redeployment'||id==='pre-battle'?'Confirm resolved / declined / none':id==='formations'?'Confirm revealed & legally checked':id==='secondaries'?'Confirm privately chosen & revealed':'Confirm & continue')+'</button></div></main>';
    const mount=container.querySelector('[data-prep-child]');
    if (['mission','terrain','roles','secondaries'].includes(id)) child=createBattleSetupScreen(mount,{...options,eventStage:id});
    if (['deployment','redeployment','pre-battle'].includes(id)) child=createDeploymentScreen(mount,{...options,guidedPreparation:true});
  }
  function click(e) {
    const t=e.target?.closest?.('button'); if(!t)return;
    if(t.hasAttribute('data-prep-legacy')) return send({action:'review-legacy'});
    if(t.hasAttribute('data-prep-back')) return send({action:'back'});
    if(t.hasAttribute('data-prep-first')) return send({action:'first-player',playerId:t.getAttribute('data-prep-first')});
    if(t.hasAttribute('data-prep-review')) {
      const playerId=t.getAttribute('data-prep-review');
      const input=Array.from(container.querySelectorAll('[data-prep-reserve-note]')).find(x=>x.getAttribute('data-prep-reserve-note')===playerId);
      return send({action:'reserve-review',playerId,note:input?.value});
    }
    if(t.hasAttribute('data-prep-next')) {
      const stage=preparationStep(session.getState());
      if(stage==='ready') {
        try { session.dispatch({type:COMMAND_TYPES.START_FIRST_TURN,payload:{activePlayerId:session.getState().preparation.firstPlayerId}}); session.dispatch({type:COMMAND_TYPES.CHANGE_PHASE,payload:{phase:'command'}}); }
        catch(err) {message=err.message;render();}
      } else {
        send({action:'confirm'});
        if(stage==='formations'&&preparationStep(session.getState())==='deployment') {
          try{session.dispatch({type:COMMAND_TYPES.ENTER_DEPLOYMENT});}catch(err){message=err.message;render();}
        }
      }
    }
  }
  function change(e) {
    const t=e.target;
    if(t.hasAttribute?.('data-prep-transport')&&t.value) return send({action:'formation',unitId:t.getAttribute('data-prep-transport'),kind:'embarked',transportId:t.value});
    if(t.hasAttribute?.('data-prep-location')) {
      if(t.value==='embarked'){message='Choose the transport beside this unit.';render();return;}
      send({action:'formation',unitId:t.getAttribute('data-prep-location'),kind:t.value});
    }
  }
  container.addEventListener('click',click);container.addEventListener('change',change);
  const unsubscribe=session.subscribe(render);render();
  return {render,setTab:render,destroy(){destroyed=true;unsubscribe();child?.destroy();container.removeEventListener('click',click);container.removeEventListener('change',change);container.replaceChildren();}};
}
