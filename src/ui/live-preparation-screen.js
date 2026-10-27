import { createBattleSetupScreen } from './battle-setup-screen.js';
import { createDeployBeginScreen } from './deploy-begin-screen.js';
import { preparationIssues } from '../rules/event-preparation.js';
import { isCombinedDeployment } from '../rules/deployment-workspace.js';
import { COMMAND_TYPES } from '../commands/game-commands.js';
import { escapeDeploymentText as esc } from './deploy-begin-view.js';

export function createLivePreparationScreen(container,options={}) {
  const {session}=options;
  let child=null,referenceScreen=null,message='',destroyed=false,combinedMounted=false,terrainReference=false;
  function render() {
    if(destroyed)return;
    const state=session.getState();
    if(isCombinedDeployment(state)) {
      if(combinedMounted)return;
      child?.destroy();referenceScreen?.destroy();referenceScreen=null;terrainReference=false;
      container.innerHTML='<div data-live-deploy-begin></div>';
      const mount=container.querySelector('[data-live-deploy-begin]');
      child=mount?createDeployBeginScreen(mount,options):null;combinedMounted=true;return;
    }
    if(state.battle?.status==='active')return;
    child?.destroy();referenceScreen?.destroy();referenceScreen=null;combinedMounted=false;
    const issues=preparationIssues(state,'mission');
    const deployStyle=new URL('./styles/deploy-begin.css',import.meta.url).href;
    const layoutNavigationMarkup=`<div class="live-preparation__actions"><button type="button" data-prep-terrain-reference>View terrain setup</button><button type="button" data-prep-next${issues.length?' disabled':''}>Continue to Deploy &amp; Begin</button></div>`;
    container.innerHTML=`<link rel="stylesheet" href="${deployStyle}"><main class="live-preparation"><h1>Prepare game</h1><p>Confirm the missions and layout, then deploy both armies and select reserves together.</p><div data-prep-child></div><p role="status">${esc(message)}</p>${issues.length?`<ul>${issues.map(issue=>`<li>${esc(issue)}</li>`).join('')}</ul>`:''}${terrainReference?`<div class="deploy-reference-overlay"><section role="dialog" aria-modal="true" aria-label="Terrain setup"><header><h2>Terrain setup</h2><button type="button" data-prep-close-terrain>Back to Prepare game</button></header><div data-prep-terrain-content></div></section></div>`:''}</main>`;
    const mount=container.querySelector('[data-prep-child]');
    if(mount)child=createBattleSetupScreen(mount,{...options,eventStage:'mission',layoutNavigationMarkup});
    const terrainMount=container.querySelector('[data-prep-terrain-content]');
    if(terrainReference&&terrainMount)referenceScreen=createBattleSetupScreen(terrainMount,{...options,eventStage:'terrain'});
  }
  function click(event){
    if(event.target?.closest?.('[data-prep-terrain-reference]')){terrainReference=true;render();return;}
    if(event.target?.closest?.('[data-prep-close-terrain]')){terrainReference=false;render();return;}
    if(!event.target?.closest?.('[data-prep-next]'))return;
    try{message='';session.dispatch({type:COMMAND_TYPES.UPDATE_DEPLOYMENT_WORKSPACE,payload:{action:'open'}});}
    catch(error){message=error.message;render();}
  }
  container.addEventListener('click',click);const unsubscribe=session.subscribe(render);render();
  return {render,setTab:render,destroy(){destroyed=true;unsubscribe();child?.destroy();referenceScreen?.destroy();container.removeEventListener('click',click);container.replaceChildren();}};
}
