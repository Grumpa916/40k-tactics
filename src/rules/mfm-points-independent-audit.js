import {findArmyUnitCandidates} from '../data/army-unit-catalog.js';
import {getFirstCopyPointBenchmark,PRICE_RECONCILIATION_SOURCES} from '../data/mfm-points-independent-reconciliation-20261112.js';

function canonicalName(value){
 return String(value??'').normalize('NFKD').toLowerCase()
   .replace(/[’‘]/g,"'").replace(/[^a-z0-9]+/g,' ').trim();
}
/**
 * An independent price benchmark is NOT official GW row certification.
 * Verify first-copy/default-size values and identify future drift.
 * Conditional tiers, equipment and enhancement costs must be reviewed
 * separately; do not infer them from one default-size price.
 */
export function auditIndependentFirstCopyPoints(faction,provided=null){
 const all=provided??findArmyUnitCandidates({faction});
 // Marine benchmark intentionally includes the 87 current core/Codex entries,
 // excluding the separate 89 Legends names. The Tyranid benchmark contains
 // all 57 reviewed source rows, including five explicitly marked Legends.
 const candidates=String(faction??'').toLowerCase()==='space marines'
  ?all.filter(unit=>unit.legends!==true):all;
 const benchmarks=getFirstCopyPointBenchmark(faction);
 const table=new Map(benchmarks.map(x=>[canonicalName(x.name),x]));
 const found=new Set();
 const results=candidates.map(unit=>{
   const key=canonicalName(unit.name);
   const baseline=table.get(key);
   if(baseline)found.add(key);
   let status='matched';
   if(!baseline)status='missing-benchmark';
   else if(!Number.isFinite(unit.defaultPoints)||!Number.isFinite(unit.defaultModelCount))status='missing-local-price';
   else if(unit.defaultPoints!==baseline.points||unit.defaultModelCount!==baseline.models)status='mismatch';
   return Object.freeze({
     name:unit.name,datasheetId:unit.id,status,
     expected:baseline?{models:baseline.models,points:baseline.points}:null,
     actual:{models:unit.defaultModelCount??null,points:unit.defaultPoints??null},
     officialCertification:'not-yet-verified-with-GW-Oct-14-MFM'
   });
 });
 const missingCatalog=benchmarks.filter(x=>!found.has(canonicalName(x.name))).map(x=>x.name);
 return Object.freeze({
   faction,
   sourceStatus:PRICE_RECONCILIATION_SOURCES.status,
   officialPointsFullyCertified:false,
   GWPrimaryRowsChecked:0,
   rows:results.length,
   benchmarks:benchmarks.length,
   matched:results.filter(x=>x.status==='matched').length,
   mismatches:results.filter(x=>x.status!=='matched'),
   missingCatalog:Object.freeze(missingCatalog),
   results:Object.freeze(results)
 });
}
