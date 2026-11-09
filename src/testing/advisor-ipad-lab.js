import {
  ADVISOR_IPAD_SCENARIOS,createAdvisorIpadState,applyAdvisorIpadAction
} from './advisor-ipad-scenarios.js';
import { inspectAdvisorIpadScenario } from './advisor-ipad-checks.js';

const root=document.getElementById('advisor-ipad-lab');
const esc=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;')
  .replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
const manualItems=[
  {key:'legible',label:'Advisor text is legible at normal iPad zoom'},
  {key:'touch',label:'Buttons and disclosures respond to one finger tap'},
  {key:'layout',label:'Nothing overlaps the map, controls or Safari bottom bar'},
  {key:'scroll',label:'Right panel scrolls independently without losing position'},
  {key:'drag',label:'Green marker drags smoothly and forecasts react'}
];
let scenarioId='planning';
let state=createAdvisorIpadState(scenarioId);
let measuredDistance=7;
let message='';
let messageError=false;
let lastInspection=null;
const manual=new Map();
const visits=new Map();
let drag=null;

function scaffold() {
  root.innerHTML='<div class="lab-root">'+
    '<header class="lab-header"><div class="lab-topline">'+
      '<div><small>40K TACTICS / INDEPENDENT IPAD TEST LAB</small>'+
      '<h1>Tactical Advisor · Guided Safari Test</h1>'+
      '<p>Production Advisor calculations and panels on disposable simulated battles. No account, cloud connection, saved roster or real game updates.</p></div>'+
      '<div class="lab-tools">'+
        '<button type="button" data-reset>Reset scenario</button>'+
        '<button type="button" data-copy-report>Copy test report</button>'+
        '<a href="./battle.html" target="_blank" rel="noopener">Open live app</a>'+
      '</div></div>'+
      '<nav class="lab-scenarios" aria-label="Test scenarios" id="lab-scenarios"></nav>'+
    '</header>'+
    '<section class="lab-layout">'+
      '<aside class="lab-panel lab-left" aria-label="Guided testing steps">'+
        '<h2 id="lab-scenario-title"></h2><div class="lab-instructions" id="lab-expect"></div>'+
        '<p class="lab-note">Test simulation only: the buttons below inject disposable events shaped like live recorded actions. They do not exercise the live game’s attack/charge command buttons.</p>'+
        '<h3>Try these actions</h3><div class="lab-actions" id="lab-actions"></div>'+
        '<p class="lab-message" id="lab-message" role="status" aria-live="polite"></p>'+
        '<h3>Automatic calculations · <span id="lab-count"></span></h3>'+
        '<div class="lab-checks" id="lab-checks"></div>'+
        '<h3>Manual iPad/Safari acceptance</h3><p class="lab-instructions">Tap each result to cycle: Not checked → Pass → Fail. Results stay in this tab only.</p>'+
        '<div class="lab-manual" id="lab-manual"></div>'+
      '</aside>'+
      '<section class="lab-panel lab-board-panel" aria-label="Approximate sample battlefield">'+
        '<div class="lab-board-head"><div><h2>Test battlefield · 60″ × 44″</h2>'+
          '<p>Drag the green unit with your finger. This corrects only this test fixture’s approximate marker coordinates.</p></div>'+
          '<span id="lab-map-distance" class="lab-legend"></span></div>'+
        '<div class="lab-board" id="lab-board" aria-label="Illustrative board with test formations">'+
          '<span class="lab-marker objective" data-map-id="c1" aria-label="Test objective">C1</span>'+
          '<button type="button" class="lab-marker own" data-map-id="a" aria-label="Drag Allarus test formation">AC</button>'+
          '<span class="lab-marker enemy" data-map-id="b" aria-label="Enemy objective holder">EH</span>'+
        '</div>'+
        '<div class="lab-legend"><span>AC · Your selected formation</span><span>EH · Test enemy</span><span>C1 · Objective</span></div>'+
        '<p class="lab-board-explain" id="lab-map-note"></p>'+
      '</section>'+
      '<section class="lab-panel lab-right" aria-label="Actual Tactical Advisor rendering">'+
        '<h2>Actual Advisor panel</h2>'+
        '<p class="lab-board-explain">This section renders the project’s real Turn Planning or Adaptive Execution component. Tap the headings to open or close.</p>'+
        '<div id="lab-real-panel" class="lab-real-panel"></div>'+
        '<div id="lab-metrics" class="lab-metrics" aria-label="Calculated values"></div>'+
      '</section>'+
    '</section>'+
    '<footer class="lab-footer">Isolated browser-memory test · refreshed or closed = reset · calculated pass/fail does not replace real live-play acceptance on iPad</footer>'+
  '</div>';
}

function scenarioButtons(){
  document.getElementById('lab-scenarios').innerHTML=ADVISOR_IPAD_SCENARIOS.map(scenario=>
    '<button type="button" data-scenario-id="'+esc(scenario.id)+'" aria-pressed="'+(scenario.id===scenarioId?'true':'false')+'">'+
      esc(scenario.title)+'</button>').join('');
}

function currentManual(key){
  return manual.get(scenarioId+':'+key)??'unchecked';
}

function renderManual(){
  document.getElementById('lab-manual').innerHTML=manualItems.map(item=>{
    const status=currentManual(item.key);
    return '<div class="lab-manual-row"><span>'+esc(item.label)+'</span>'+
      '<button type="button" data-manual-key="'+esc(item.key)+'" data-mark="'+esc(status)+'" aria-label="'+esc(item.label)+
      ': '+esc(status)+'">'+(status==='pass'?'PASS':status==='fail'?'FAIL':'Not checked')+'</button></div>';
  }).join('');
}

function controls() {
  const actions=[];
  const add=(action,label,extra='')=>actions.push('<button type="button" data-sim-action="'+action+'" '+extra+'>'+label+'</button>');
  if(scenarioId==='shooting'){
    add('shoot-3','Record 3 damage','class="is-positive"');
    add('shoot-2','Record 2 damage');
  }else if(scenarioId==='measured'){
    actions.push('<label>Measured Charge distance<select data-measured-distance>'+
      Array.from({length:11},(_,i)=>i+2).map(n=>
        '<option value="'+n+'"'+(n===measuredDistance?' selected':'')+'>'+n+'″</option>').join('')+
      '</select></label>');
    add('charge-success','Record successful Charge','class="is-positive"');
    add('charge-failed','Record failed Charge','class="is-destructive"');
  }else if(scenarioId==='success'){
    add('fight-3','Record 3 Fight damage','class="is-positive"');
    add('finish-fight','Finish Fight activation');
  }else if(scenarioId==='fight'){
    add('reset','Restart completed Fight');
    add('load:success','Practice unfinished Fight');
  }else if(scenarioId==='movement'){
    add('reset','Reset marker position');
    add('load:planning','Compare Command plan');
  }else if(scenarioId==='planning'){
    add('load:movement','Test movement staging');
    add('load:shooting','Test recorded damage');
  }else if(scenarioId==='failed'){
    add('load:measured','Retry with measured Charge');
  }else if(scenarioId==='destroyed'){
    add('load:shooting','Test damage recording');
  }else if(scenarioId==='opponent'){
    add('load:planning','Return to your turn');
  }
  return actions.join('');
}

function renderChecks(inspection) {
  document.getElementById('lab-count').textContent=inspection.passed+'/'+inspection.total+' passed';
  document.getElementById('lab-checks').innerHTML=inspection.checks.map(check=>
    '<section class="lab-check '+(check.passes?'pass':'pending')+'">'+
      '<span class="lab-status">'+(check.passes?'PASS':'TO VERIFY')+'</span>'+
      '<strong>'+esc(check.label)+'</strong>'+
      '<span>'+esc(check.detail)+'</span></section>'
  ).join('');
}

function setMarker(id,position){
  const marker=root.querySelector('[data-map-id="'+id+'"]');
  if(!marker || !position) return;
  marker.style.left=(position.x/60*100)+'%';
  marker.style.top=(position.y/44*100)+'%';
}

function renderMap(){
  const own=state.units.find(u=>u.id==='a');
  const foe=state.units.find(u=>u.id==='b');
  const objective=state.objectives.find(o=>o.id==='c1');
  setMarker('a',own?.position);
  setMarker('b',foe?.position);
  setMarker('c1',objective?.position);
  const enemyMarker=root.querySelector('[data-map-id="b"]');
  if(enemyMarker) enemyMarker.style.opacity=foe?.status==='destroyed'?'0.25':'1';
  const distance=own?.position && foe?.position
    ?Math.hypot(own.position.x-foe.position.x,own.position.y-foe.position.y).toFixed(1):'—';
  document.getElementById('lab-map-distance').textContent='Markers ~'+distance+'″ apart';
  document.getElementById('lab-map-note').textContent='Selected: '+own?.name+
    ' at ('+own?.position?.x+', '+own?.position?.y+'). Opponent: '+foe?.name+
    ', '+(foe?.status==='destroyed'?'destroyed':foe?.wounds+' wounds')+
    '. Positions are approximate and cannot prove line of sight or legal movement.';
}

function formatDiagnostics(inspection){
  const a=inspection.execution;
  const p=inspection.plan;
  const m=inspection.movement;
  const parts=[
    'Phase: '+state.phase+' · active: '+state.activePlayer,
    'Synthetic events: '+state.history.length,
    a ? 'Recorded Shooting: '+(a.available?a.shooting.attacks+' attacks / '+a.shooting.actualDamage+' actual damage':'not available') : '',
    a?.available?'Recorded Charge: '+(a.charge.outcome??'pending'):' ',
    a?.available?'Fight attacks: '+a.fight.attacks+' / finished: '+a.fight.finished:' ',
    a?.available?'Enemy remaining wounds: '+(a.targetWounds??'unknown'):' ',
    p?.available?'Current attack target: '+(p.attack?.targetName??'not in sampled range'):' ',
    m?.available?'What-if positions: '+m.options.map(o=>o.kind).join(', '):' '
  ].filter(Boolean);
  return '<strong>Scenario evidence · '+inspection.passed+'/'+inspection.total+' automatic checks</strong>'+
    '<pre>'+esc(parts.join('\n'))+'</pre>';
}

function restoreDisclosure(){
  return new Map([...document.querySelectorAll('#lab-real-panel [data-view-key]')]
    .map(node=>[node.getAttribute('data-view-key'),node.open]));
}

function render(){
  const disclosure=restoreDisclosure();
  const scenario=ADVISOR_IPAD_SCENARIOS.find(item=>item.id===scenarioId);
  document.getElementById('lab-scenario-title').textContent=scenario.title;
  document.getElementById('lab-expect').innerHTML='<p><strong>Expected:</strong> '+esc(scenario.expected)+'</p>'+
    '<p>Step through the scenario, expand the right panel and compare automatic calculations with actual iPad touch behavior.</p>';
  scenarioButtons();
  document.getElementById('lab-actions').innerHTML=controls();
  const messageNode=document.getElementById('lab-message');
  messageNode.textContent=message;
  messageNode.classList.toggle('is-error',messageError);
  renderMap();
  renderManual();
  try {
    lastInspection=inspectAdvisorIpadScenario(state,{scenarioId,measuredDistance});
    document.getElementById('lab-real-panel').innerHTML=lastInspection.html ||
      '<p class="lab-fallback">Offensive Advisor is intentionally hidden on this opponent-turn test.</p>';
    for(const node of document.querySelectorAll('#lab-real-panel [data-view-key]')){
      const previously=disclosure.get(node.getAttribute('data-view-key'));
      if(previously!==undefined) node.open=previously;
    }
    document.getElementById('lab-metrics').innerHTML=formatDiagnostics(lastInspection);
    renderChecks(lastInspection);
    visits.set(scenarioId,{passed:lastInspection.passed,total:lastInspection.total});
  }catch(error){
    lastInspection=null;
    document.getElementById('lab-real-panel').innerHTML='<p class="lab-fallback">Advisor calculation failed: '+esc(error.message)+'</p>';
    document.getElementById('lab-metrics').textContent='This failure can be included in the copied report.';
    document.getElementById('lab-checks').textContent='ERROR · '+error.message;
    document.getElementById('lab-count').textContent='0 checks';
    visits.set(scenarioId,{passed:0,total:1,error:String(error)});
  }
}

function loadScenario(id){
  state=createAdvisorIpadState(id);
  scenarioId=id;
  measuredDistance=7;
  message='Scenario reset. Changes here never touch a saved game.';
  messageError=false;
  render();
}

function perform(action){
  if(action==='reset'){loadScenario(scenarioId);return;}
  if(action.startsWith('load:')){loadScenario(action.slice(5));return;}
  try {
    state=applyAdvisorIpadAction(state,action,{distance:measuredDistance});
    if(action==='charge-success'||action==='charge-failed'){
      scenarioId=action==='charge-success'?'success':'failed';
      state={...state,phase:'fight'};
    }else if(action==='fight-3'){
      scenarioId='fight';
    }
    message='Test action applied to disposable scenario only: '+action+'.';
    messageError=false;
  }catch(error){
    message='Test action blocked: '+error.message;
    messageError=true;
  }
  render();
}

function manualReport(){
  return Object.fromEntries([...manual.entries()]);
}

function reportText(){
  const all=ADVISOR_IPAD_SCENARIOS.map(item=>{
    const info=visits.get(item.id);
    return item.title+': '+(info?info.passed+'/'+info.total+(info.error?' · '+info.error:''):'not visited');
  }).join('\n');
  const self=lastInspection;
  const statuses=manualItems.map(item=>item.label+' — '+currentManual(item.key)).join('\n');
  return '40K Tactics · iPad Tactical Advisor Test Report\n'+
    'Scenario: '+scenarioId+' · phase: '+state.phase+'\n'+
    'Screen: '+window.innerWidth+' × '+window.innerHeight+' CSS px\n'+
    'Orientation: '+(window.innerWidth>=window.innerHeight?'landscape':'portrait')+'\n'+
    'Generated: '+new Date().toISOString()+'\n\n'+
    'Automatic result: '+(self?self.passed+'/'+self.total:'error')+'\n'+
    (self?self.checks.map(check=>(check.passes?'PASS':'PENDING')+' · '+check.label).join('\n'):'')+
    '\n\nManual results (current scenario):\n'+statuses+
    '\n\nScenarios visited:\n'+all+
    '\n\nAll manual results:\n'+JSON.stringify(manualReport(),null,2)+
    '\n\nSafety: synthetic browser-memory state; no live battle data or cloud used.';
}

async function copyReport(){
  const report=reportText();
  try{
    await navigator.clipboard.writeText(report);
    message='Test report copied. Paste it into this chat after testing.';
    messageError=false;
  }catch{
    const node=document.createElement('textarea');
    node.value=report;
    node.style.position='fixed';node.style.opacity='0';
    document.body.appendChild(node);node.select();
    const success=document.execCommand?.('copy');
    node.remove();
    message=success?'Test report copied. Paste it into this chat after testing.':
      'Clipboard permission was blocked. Select and copy the report in Safari.';
    messageError=!success;
    if(!success) window.prompt('Copy your iPad test report',report);
  }
  render();
}

function init(){
  if(!root) return;
  scaffold();
  root.addEventListener('click',event=>{
    const btn=event.target.closest('button');
    if(!btn || !root.contains(btn))return;
    const scenario=btn.getAttribute('data-scenario-id');
    if(scenario){loadScenario(scenario);return;}
    if(btn.hasAttribute('data-reset')){loadScenario(scenarioId);return;}
    if(btn.hasAttribute('data-copy-report')){void copyReport();return;}
    const action=btn.getAttribute('data-sim-action');
    if(action){perform(action);return;}
    const manualKey=btn.getAttribute('data-manual-key');
    if(manualKey){
      const before=currentManual(manualKey);
      manual.set(scenarioId+':'+manualKey,before==='unchecked'?'pass':before==='pass'?'fail':'unchecked');
      renderManual();
    }
  });
  root.addEventListener('change',event=>{
    if(event.target.matches('[data-measured-distance]')){
      measuredDistance=Number(event.target.value);
      message='Measured distance updated for this scenario only.';
      messageError=false;
      render();
    }
  });
  const marker=root.querySelector('[data-map-id="a"]');
  const board=root.querySelector('#lab-board');
  marker.addEventListener('pointerdown',event=>{
    if(event.button!==0) return;
    drag={pointerId:event.pointerId};
    marker.setPointerCapture(event.pointerId);
    marker.classList.add('is-dragging');
    event.preventDefault();
  });
  marker.addEventListener('pointermove',event=>{
    if(drag?.pointerId!==event.pointerId)return;
    const bounds=board.getBoundingClientRect();
    const x=Math.max(0,Math.min(60,(event.clientX-bounds.left)/bounds.width*60));
    const y=Math.max(0,Math.min(44,(event.clientY-bounds.top)/bounds.height*44));
    marker.style.left=x/60*100+'%';
    marker.style.top=y/44*100+'%';
  });
  marker.addEventListener('pointerup',event=>{
    if(drag?.pointerId!==event.pointerId)return;
    drag=null;
    marker.classList.remove('is-dragging');
    const bounds=board.getBoundingClientRect();
    const position={
      x:Math.max(0,Math.min(60,(event.clientX-bounds.left)/bounds.width*60)),
      y:Math.max(0,Math.min(44,(event.clientY-bounds.top)/bounds.height*44))
    };
    try{
      state=applyAdvisorIpadAction(state,'move-marker',{position});
      message='Test marker repositioned. Forecast recalculated from new approximate position.';
      messageError=false;
    }catch(error){
      message=error.message;messageError=true;
    }
    render();
  });
  marker.addEventListener('pointercancel',()=>{
    drag=null;marker.classList.remove('is-dragging');renderMap();
  });
  loadScenario(scenarioId);
}
init();
