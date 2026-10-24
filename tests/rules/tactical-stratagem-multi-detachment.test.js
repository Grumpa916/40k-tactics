import test from "node:test";
import assert from "node:assert/strict";
import { getStratagemResourceContext } from "../../src/rules/tactical-stratagem-context.js";

function state() {
  return {
    phase:"shooting", activePlayer:"p1", commandPoints:{p1:2,p2:1},
    players:[{id:"p1"},{id:"p2"}], units:[{id:"enemy",ownerId:"p2",status:"deployed"}],
    armyRosters:{
      p1:{
        detachments:["Alpha","Beta"], detachment:"Alpha",
        rulesDataRevision:{factionRules:{
          armyRules:[{name:"Faction Rule",description:"Reference text only."}],
          detachments:[
            {name:"Alpha",ruleName:"Alpha Rule",rule:"Reference-only detachment effect.",stratagemCatalogStatus:"complete",stratagems:[{name:"Alpha Fire",cpCost:1,phases:["shooting"],description:"Improve attacks."}]},
            {name:"Beta",ruleName:"Beta Rule",rule:"Another reference-only effect.",stratagemCatalogStatus:"complete",stratagems:[{name:"Beta Fire",cpCost:2,phases:["shooting"],description:"Improve wound rolls."}]}
          ]
        }}
      },
      p2:{rulesDataRevision:{factionRules:{detachments:[]}}}
    }
  };
}

test("advisor aggregates affordable Stratagems from every selected detachment", () => {
  const context=getStratagemResourceContext(state(),{playerId:"p1",targetUnitId:"enemy"});
  assert.deepEqual(context.own.detachmentNames,["Alpha","Beta"]);
  assert.deepEqual(context.own.combat.map(item=>item.name),["Alpha Fire","Beta Fire"]);
  assert.deepEqual(context.own.combat.map(item=>item.detachmentName),["Alpha","Beta"]);
});

test("detachment and army rules are surfaced as reference-only instead of silently scored", () => {
  const context=getStratagemResourceContext(state(),{playerId:"p1",targetUnitId:"enemy"});
  assert.equal(context.own.detachmentRules.length,2);
  assert.equal(context.own.armyRules.length,1);
  assert.ok(context.own.detachmentRules.every(rule=>rule.implementationStatus==="reference-only"));
  assert.match(context.reason,/does not silently change target ranking/i);
});
