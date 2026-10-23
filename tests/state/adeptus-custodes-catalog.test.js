import test from 'node:test';
import assert from 'node:assert/strict';
import { findArmyUnitCandidates } from '../../src/data/army-unit-catalog.js';
import { importWarhammerAppRoster } from '../../src/state/warhammer-app-roster-import.js';
import { getRulesDataRevisionForFaction, formatRulesDataRevision } from '../../src/data/rules-data-revisions.js';
import { ADEPTUS_CUSTODES_DETACHMENTS, ADEPTUS_CUSTODES_KATAH } from '../../src/data/adeptus-custodes-faction-rules.js';
import { getAdeptusCustodesWargearRuleSet } from '../../src/data/adeptus-custodes-wargear-rules.js';
import { validateWargearLoadout } from '../../src/rules/wargear-loadout-validation.js';
import { detachmentOptions } from '../../src/ui/army-builder-options.js';

const exportText = `Adeptus Custodes\nGuardians of the Throne (3 Detachment Points)\nOnslaught (3,000 Points)\n\nCHARACTERS\n\nBlade Champion (175 Points)\n  • 1x Vaultswords\n\nBATTLELINE\n\nCustodian Guard Sodality (240 Points)\n  • 3x Custodian Guard\n     ◦ 3x Guardian Spear\n\nOTHER DATASHEETS\n\nTelemon Heavy Dreadnought (280 Points)\n  • 1x Dual Caestus Fists\n  • 1x Spiculus Bolt Launcher\n  • 2x Twin Neutronium Cascade Projectors`;

test('Adeptus Custodes catalog has full current and Legends profile coverage', () => {
  const candidates = findArmyUnitCandidates({ faction: 'Adeptus Custodes' });
  assert.equal(candidates.length, 36);
  assert.equal(candidates.filter(unit => unit.legends).length, 7);
  for (const unit of candidates) {
    assert.ok(unit.datasheet?.characteristics?.Toughness != null, unit.name);
    assert.ok(unit.datasheet?.weapons?.length, unit.name);
    assert.ok(unit.datasheet?.abilities?.length, unit.name);
    assert.ok(unit.pointsOptions?.length, unit.name);
    assert.match(unit.verificationStatus, /^source-reviewed/);
    assert.ok(unit.rulesDataRevisionId, unit.name);
  }
  const guard=candidates.find(unit=>unit.name==='Custodian Guard Sodality');
  assert.equal(guard.datasheet.characteristics.Toughness,7);
  assert.equal(guard.datasheet.characteristics.Wounds,5);
  assert.equal(guard.defaultPoints,240);
  const telemon=candidates.find(unit=>unit.name==='Telemon Heavy Dreadnought');
  assert.equal(telemon.datasheet.characteristics.Toughness,11);
  assert.equal(telemon.datasheet.characteristics.Wounds,14);
  assert.equal(telemon.defaultPoints,280);
  const prosecutors=candidates.find(unit=>unit.name==='Prosecutor Squad');
  assert.ok(prosecutors.pointsOptions.some(option=>option.models===4&&option.points===45));
});

test('current Custodes rules track Codex, October MFM, six katahs and 13 detachments',()=>{
  const revision=getRulesDataRevisionForFaction('Adeptus Custodes');
  assert.equal(revision.factionRules.publicationType,'Codex');
  assert.equal(revision.points.revision,'2026-10-14');
  assert.match(formatRulesDataRevision(revision),/Codex: Adeptus Custodes/);
  assert.equal(ADEPTUS_CUSTODES_KATAH.length,6);
  assert.deepEqual(new Set(ADEPTUS_CUSTODES_KATAH.map(item=>item.name)),new Set(['Conservai','Calistus','Salvus','Dacatarai','Kaptaris','Rendax']));
  assert.equal(ADEPTUS_CUSTODES_DETACHMENTS.length,13);
  const guardians=ADEPTUS_CUSTODES_DETACHMENTS.find(item=>item.name==='Guardians of the Throne');
  assert.equal(guardians.detachmentPoints,3);
  assert.equal(guardians.forceDisposition,'Priority Assets and Purge the Foe');
  const solar=ADEPTUS_CUSTODES_DETACHMENTS.find(item=>item.name==='Solar Watch');
  assert.equal(solar.uniqueShieldHost,true);
  assert.equal(solar.forceDisposition,'Reconnaissance');
  const html=detachmentOptions('Adeptus Custodes','Guardians of the Throne');
  assert.match(html,/Guardians of the Throne · Priority Assets and Purge the Foe · 3 DP/);
  assert.match(html,/Solar Watch · Reconnaissance · 1 DP · Unique Shield Host/);
});

test('Adeptus Custodes import resolves current selected combat profiles and revision stamp', () => {
  const result = importWarhammerAppRoster({ text: exportText, faction: 'Adeptus Custodes', name: 'Custodes test', pointsLimit: 3000, id: 'custodes' });
  assert.equal(result.roster.units.length, 3);
  assert.equal(result.roster.units[1].modelCount, 3);
  assert.equal(result.roster.units[0].points, 175);
  assert.equal(result.unrecognized.length,0);
  assert.equal(result.roster.rulesDataRevision?.faction,'Adeptus Custodes');
  for(const unit of result.roster.units) assert.equal(unit.unmatchedWargear?.length??0,0,unit.name);
  const blade=result.roster.units.find(unit=>unit.name==='Blade Champion');
  assert.deepEqual(new Set(blade.equippedWeapons.map(item=>item.name)),new Set(['Vaultswords – Behemor','Vaultswords – Hurricanis','Vaultswords – Victus']));
  const guard=result.roster.units.find(unit=>unit.name==='Custodian Guard Sodality');
  assert.equal(guard.loadoutValidation.status,'rules-reviewed-valid');
  assert.equal(guard.equippedWeapons.find(item=>item.name==='Guardian Spear (ranged)')?.quantity,3);
  const telemon=result.roster.units.find(unit=>unit.name==='Telemon Heavy Dreadnought');
  assert.equal(telemon.loadoutValidation.status,'rules-reviewed-valid');
  assert.equal(telemon.equippedWeapons.find(item=>item.name==='Twin Neutronium Cascade Projectors')?.quantity,2);
});

test('reviewed Custodes loadout rules and attachments are exposed to shared systems',()=>{
  assert.ok(getAdeptusCustodesWargearRuleSet('adeptus-custodes:shield-captain'));
  const candidates=findArmyUnitCandidates({faction:'Adeptus Custodes'});
  const trajann=candidates.find(unit=>unit.name==='Trajann Valoris');
  assert.ok(trajann.datasheet.leader.allowedBodyguardDatasheetIds.includes('adeptus-custodes:custodian-guard-sodality'));
  const allarusCaptain=candidates.find(unit=>unit.name==='Shield-Captain in Allarus Terminator Armour');
  assert.ok(allarusCaptain.datasheet.leader.allowedBodyguardDatasheetIds.includes('adeptus-custodes:aquilon-terminators-with-solarite-power-gauntlets'));
  const prosecutors=candidates.find(unit=>unit.name==='Prosecutor Squad');
  assert.equal(prosecutors.datasheet.bodyguard.maxAttachedLeaders,2);
});
