import { createDeploymentScreen } from './deployment-screen.js';
import { createBattleSetupScreen } from './battle-setup-screen.js';
import { renderDeployBeginView } from './deploy-begin-view.js';
import { COMMAND_TYPES } from '../commands/game-commands.js';

export function createDeployBeginScreen(container,options={}) {
  const {session}=options;
  let map=null,referenceScreen=null,selectedUnitId=null,message='',reference=null,destroyed=false;
  let rolesOpen=false,transportsOpen=false,checklistOpen=false;
  function render() {
    if(destroyed)return;
    selectedUnitId=map?.getSelectedUnitId?.()??selectedUnitId;
    rolesOpen=container.querySelector('[data-deploy-roles]')?.open??rolesOpen;
    transportsOpen=container.querySelector('[data-deploy-transports]')?.open??transportsOpen;
    checklistOpen=container.querySelector('[data-deploy-checklist]')?.open??checklistOpen;
    map?.destroy();referenceScreen?.destroy();map=null;referenceScreen=null;
    container.innerHTML=renderDeployBeginView(session.getState(),{selectedUnitId,message,rolesOpen,transportsOpen,checklistOpen,reference});
    const mapHost=container.querySelector('[data-deploy-map]');
    if(mapHost)map=createDeploymentScreen(mapHost,{...options,mapOnly:true,guidedPreparation:true,initialSelectedUnitId:selectedUnitId,onSelectionChange:id=>{selectedUnitId=id;render();}});
    const refHost=container.querySelector('[data-deploy-reference-content]');
    if(reference&&refHost)referenceScreen=createBattleSetupScreen(refHost,{...options,eventStage:reference});
  }
  function send(payload) {
    try{message='';session.dispatch({type:COMMAND_TYPES.UPDATE_DEPLOYMENT_WORKSPACE,payload});}
    catch(error){message=error.message;render();}
  }
  function click(event) {
    const reserve=event.target?.closest?.('[data-map-reserve-select]');
    if(reserve) {
      selectedUnitId=reserve.getAttribute('data-map-reserve-select');map?.selectUnit(selectedUnitId);render();return;
    }
    if(event.target?.closest?.('[data-map-reserve-area]')) {
      const id=map?.getSelectedUnitId?.()??selectedUnitId;
      const state=session.getState();
      if(!id || state.battlefieldMap?.declaredReserves?.[id])return;
      try {message='';session.dispatch({type:COMMAND_TYPES.TRANSFER_MAP_RESERVE,payload:{unitId:id,destination:'reserves'}});}
      catch(error){message=error.message;render();}
      return;
    }
    const button=event.target?.closest?.('button');if(!button)return;
    if(button.hasAttribute('data-deploy-select')) {
      selectedUnitId=button.getAttribute('data-deploy-select');map?.selectUnit(selectedUnitId);
      render();
    } else if(button.hasAttribute('data-deploy-location'))send({action:'location',unitId:button.getAttribute('data-deploy-unit'),kind:button.getAttribute('data-deploy-location')});
    else if(button.hasAttribute('data-deploy-role'))send({action:button.getAttribute('data-deploy-role'),playerId:button.getAttribute('data-deploy-player')});
    else if(button.hasAttribute('data-deploy-review'))send({action:'reserve-review',playerId:button.getAttribute('data-deploy-review')});
    else if(button.hasAttribute('data-deploy-begin'))send({action:'begin'});
    else if(button.hasAttribute('data-deploy-reference')){reference=button.getAttribute('data-deploy-reference');render();}
    else if(button.hasAttribute('data-deploy-close-reference')){reference=null;render();}
  }
  function change(event) {
    const field=event.target;if(!field.hasAttribute?.('data-deploy-transport'))return;
    send({action:'location',unitId:field.getAttribute('data-deploy-transport'),kind:field.value?'embarked':'field',transportId:field.value||null});
  }
  container.addEventListener('click',click);container.addEventListener('change',change);
  const unsubscribe=session.subscribe(render);render();
  return {render,destroy(){destroyed=true;unsubscribe();map?.destroy();referenceScreen?.destroy();container.removeEventListener('click',click);container.removeEventListener('change',change);container.replaceChildren();}};
}
