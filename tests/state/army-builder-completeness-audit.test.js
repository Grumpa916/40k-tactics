import test from "node:test";
import assert from "node:assert/strict";
import { findArmyUnitCandidates } from "../../src/data/army-unit-catalog.js";
import { auditArmyCatalogCompleteness } from "../../src/rules/army-catalog-completeness-audit.js";
import { assessSavedUnitCost, revalidateRosterRulesData } from "../../src/rules/roster-rules-data-validation.js";
import { OFFICIAL_RULES_SOURCE_INDEX } from "../../src/data/official-rules-source-index.js";

function candidate(faction, id) {
  const found=findArmyUnitCandidates({faction}).find(item=>item.id===id);
  assert.ok(found,'catalog entry: '+id);
  return found;
}
test("Army Builder completeness audit reports local evidence separately from official validation",()=>{
  for(const faction of ["Adeptus Custodes","Tyranids","Space Marines"]) {
    const audit=auditArmyCatalogCompleteness(faction);
    assert.ok(audit.counts.units>0,faction);
    assert.ok(audit.counts.withPointsOptions<=audit.counts.units);
    assert.ok(audit.counts.withCombatWeapons<=audit.counts.units);
    assert.ok(audit.counts.withReviewedSelectableWargear<=audit.counts.units);
    assert.equal(audit.officialRulesCertification,"pending-per-unit-review");
    assert.ok(audit.incompleteUnits.every(item=>item.missing.length>0));
  }
  const sm=auditArmyCatalogCompleteness("Space Marines");
  assert.equal(sm.counts.withReviewedSelectableWargear,71,"Seventy-one Space Marine unit types now have source-reviewed loadout rules; remaining units await review");
  assert.equal(sm.counts.withOfficialCrossCheckPending,sm.counts.units);
  const custodes=auditArmyCatalogCompleteness("Adeptus Custodes");
  assert.ok(custodes.counts.withReviewedSelectableWargear>0,"Custodes already has validated wargear subsets");
});

test("revalidation catches a legal price for the wrong copy number",()=>{
  const data=candidate("Adeptus Custodes","adeptus-custodes:telemon-heavy-dreadnought");
  const unit=(id,points)=>({id,name:"Telemon Heavy Dreadnought",datasheetId:data.id,
    modelCount:1,points,datasheet:data.datasheet,equippedWargear:[],equippedWeapons:[]});
  const a=unit("telemon-1",280),b=unit("telemon-2",280);
  const roster={name:"Cost check",faction:"Adeptus Custodes",units:[a,b],history:[]};
  assert.equal(assessSavedUnitCost(data,a,roster).status,"matched");
  const second=assessSavedUnitCost(data,b,roster);
  assert.equal(second.status,"mismatch");
  assert.match(second.reason,/310 pts/);
  const result=revalidateRosterRulesData(roster);
  assert.equal(result.status,"review-required");
  assert.ok(result.issues.some(text=>/Telemon.*310 pts/.test(text)));
  assert.equal(result.roster.units[1].points,280,"saved roster is never silently changed");
});

test("unknown and ambiguous prices are identified rather than accepted as verified",()=>{
  const telemon=candidate("Adeptus Custodes","adeptus-custodes:telemon-heavy-dreadnought");
  const blank={id:"blank",datasheetId:telemon.id,modelCount:1,points:null};
  assert.equal(assessSavedUnitCost(telemon,blank,{units:[blank]}).status,"missing");
  const captain=candidate("Adeptus Custodes","adeptus-custodes:shield-captain");
  const unknown={id:"captain",datasheetId:captain.id,modelCount:1,points:205,equippedWargear:[]};
  const estimate=assessSavedUnitCost(captain,unknown,{units:[unknown]});
  assert.equal(estimate.status,"unverified","unresolved shield/ordinal variant cannot certify price");
  const invalid=revalidateRosterRulesData({name:"Incomplete",faction:"Adeptus Custodes",units:[blank]});
  assert.equal(invalid.status,"review-required");
  assert.match(invalid.issues.join(" "),/No valid saved points/);
});

test("review warning stays nonblocking for otherwise legal unresolved source comparisons",()=>{
  const data=candidate("Space Marines","space-marines:aggressor-squad");
  const unit={id:"aggressors",name:"Aggressor Squad",datasheetId:data.id,modelCount:3,points:data.defaultPoints,
    datasheet:data.datasheet,equippedWargear:[],equippedWeapons:[]};
  const reviewed=revalidateRosterRulesData({name:"Space Marine test",faction:"Space Marines",units:[unit]});
  assert.ok(reviewed.warnings.some(text=>/official rules\/points cross-check is still pending/.test(text)));
  assert.equal(reviewed.roster.units[0].points,data.defaultPoints,"never rewrite original export points");
});

test("the uploaded GW Event Companion is an authoritative publication with documented inspected content",()=>{
  const source=OFFICIAL_RULES_SOURCE_INDEX.publications.eventCompanion;
  assert.equal(source.officialSourceAuthority,"verified-games-workshop-publication");
  assert.equal(source.inspectedDocumentVersion,"1.2");
  assert.deepEqual([...source.inspectedPages],[1,2,8,9]);
  assert.ok(source.verifiedProcedures.includes("VP caps"));
  assert.equal(source.status,"official-source-authenticated-content-partially-checked");
});
