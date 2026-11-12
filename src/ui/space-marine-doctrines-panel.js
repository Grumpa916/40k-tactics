import { SPACE_MARINES_DOCTRINES, getSpaceMarineDoctrineRemaining,
  getActiveSpaceMarineUnitDoctrines, getActiveSpaceMarineDoctrine } from '../rules/space-marine-doctrines.js';
import { getBattleRosterUnit } from '../rules/battle-unit-reference.js';
const esc=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;')
 .replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');

export function renderSpaceMarineDoctrinePanel(state,{playerId=state?.activePlayer??state?.battle?.activePlayerId,unitId=null}={}){
 const roster=state?.armyRosters?.[playerId];
 if(String(roster?.faction??'').toLowerCase()!=='space marines')return '';
 const active=state?.battle?.status==='active'&&state?.phase==='command'&&
   (state?.activePlayer??state?.battle?.activePlayerId)===playerId;
 const selected=(state?.units??[]).find(unit=>unit.id===unitId&&unit.ownerId===playerId&&unit.status==='deployed');
 const captain=selected&&(getBattleRosterUnit(state,selected)?.datasheet?.abilities??[])
   .some(a=>a.name==='Strategic Acumen');
 const current=getActiveSpaceMarineDoctrine(state,playerId);
 const existing=(state?.history??[]).some(e=>e.type==='space_marines.doctrine_selected'&&
    e.payload?.playerId===playerId&&e.payload?.scope==='army'&&e.payload?.turn===state.turn);
 const statuses=getSpaceMarineDoctrineRemaining(state,playerId);
 const buttons=statuses.map(item=>'<article style="display:grid;gap:4px;padding:8px;border:1px solid var(--border, #666);border-radius:8px">'+
   '<strong>'+esc(item.name)+'</strong><small>'+esc(item.summary)+'</small>'+
   '<small>Army uses '+item.uses+' · '+(item.available?'available':'spent')+'</small>'+
   (active&&!existing&&item.available?'<button type="button" style="min-height:44px" data-marine-doctrine-use="'+
     esc(item.id)+'" data-marine-doctrine-scope="army" data-marine-doctrine-player="'+esc(playerId)+
     '">Activate for Army</button>':'')+
   (active&&captain?'<button type="button" style="min-height:44px" data-marine-doctrine-use="'+
     esc(item.id)+'" data-marine-doctrine-scope="unit" data-marine-doctrine-unit="'+esc(selected.id)+
     '" data-marine-doctrine-player="'+esc(playerId)+'">Captain: apply to selected unit</button>':'')+
   '</article>').join('');
 const selectedStatuses=selected?getActiveSpaceMarineUnitDoctrines(state,selected):[];
 return '<details class="unit-rules-reminders" data-view-key="marine-doctrines" open>'+
   '<summary>Combat Doctrines · '+esc(current??'Not selected')+'</summary>'+
   '<p>Record your actual Command-phase choice. Used army-wide Doctrines remain spent this battle. A Captain with Strategic Acumen can activate an additional unit-specific Doctrine. No dice are rolled automatically.</p>'+
   (selectedStatuses.length?'<p><strong>Selected unit active:</strong> '+esc(selectedStatuses.map(id=>SPACE_MARINES_DOCTRINES.find(x=>x.id===id)?.name??id).join(' + '))+'</p>':'')+
   '<div style="display:grid;gap:8px">'+buttons+'</div>'+
   '<p>Assault: charge after Advance. Devastator: ranged weapons gain Assault. Tactical: shoot and charge after Fall Back. Confirm battle conditions on the tabletop.</p>'+
   '</details>';
}
