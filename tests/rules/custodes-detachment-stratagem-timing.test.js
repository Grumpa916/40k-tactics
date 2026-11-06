import test from "node:test";
import assert from "node:assert/strict";
import { ADEPTUS_CUSTODES_DETACHMENTS } from "../../src/data/adeptus-custodes-faction-rules.js";
import { getCustodesDetachmentStratagemReminders } from "../../src/rules/custodes-detachment-rule-reminders.js";
import { getStratagemResourceContext } from "../../src/rules/tactical-stratagem-context.js";

function battleState({ phase, activePlayer = "you", detachments }) {
  return {
    phase,
    activePlayer,
    commandPoints: { you: 3, opponent: 3 },
    players: [{ id: "you" }, { id: "opponent" }],
    battle: { status: "active", round: 1, activePlayerId: activePlayer },
    units: [],
    armyRosters: {
      you: {
        faction: "Adeptus Custodes",
        detachments,
        rulesDataRevision: { factionRules: { detachments: ADEPTUS_CUSTODES_DETACHMENTS } }
      },
      opponent: { faction: "Space Marines", detachments: [] }
    }
  };
}

function reminderNames(state) {
  return getCustodesDetachmentStratagemReminders(state, { playerId: "you" }).map(item => item.title);
}

function advisorNames(state) {
  return getStratagemResourceContext(state, { playerId: "you" }).own.phaseRelevant.map(item => item.name);
}

test("the three screenshot detachments retain their displayed rules and stratagem catalogs", () => {
  const expected = {
    "Emperor's Chosen": {
      disposition: "Priority Assets",
      rule: "Magna Imperator",
      strats: ["Superhuman Focus", "In Auramite Clad", "Impenetrable Bastion"]
    },
    "Lions of the Emperor": {
      disposition: "Disruption",
      rule: "On Gilded Wings",
      strats: ["Vigil Unending", "Unleash the Lions", "Fury of the Emperor"]
    },
    "Might of the Moritoi": {
      disposition: "Take and Hold",
      rule: "Moritoi Ancients",
      strats: ["Honoured Interred", "Unceasing Onslaught", "Unstoppable Momentum"]
    }
  };

  for (const [name, record] of Object.entries(expected)) {
    const detachment = ADEPTUS_CUSTODES_DETACHMENTS.find(item => item.name === name);
    assert.ok(detachment, `${name} is in the current selector`);
    assert.equal(detachment.detachmentPoints, 1);
    assert.equal(detachment.forceDisposition, record.disposition);
    assert.equal(detachment.ruleName, record.rule);
    assert.deepEqual(detachment.stratagems.map(item => item.name), record.strats);
    assert.ok(detachment.stratagems.every(item => item.cpCost === 1 || item.name === "Vigil Unending" && item.cpCost === 2));
  }
});

test("Unstoppable Momentum is a your-turn option in both movement and charge", () => {
  for (const phase of ["movement", "charge"]) {
    const yourTurn = battleState({ phase, detachments: ["Might of the Moritoi"] });
    assert.ok(reminderNames(yourTurn).includes("Unstoppable Momentum"));
    assert.ok(advisorNames(yourTurn).includes("Unstoppable Momentum"));

    const opponentTurn = battleState({ phase, activePlayer: "opponent", detachments: ["Might of the Moritoi"] });
    assert.ok(!reminderNames(opponentTurn).includes("Unstoppable Momentum"));
    assert.ok(!advisorNames(opponentTurn).includes("Unstoppable Momentum"));
  }
});

test("opponent Shooting or either Fight phase timing keeps its mixed-turn window", () => {
  const detachments = ["Emperor's Chosen", "Lions of the Emperor"];
  const ownShooting = battleState({ phase: "shooting", detachments });
  assert.ok(!reminderNames(ownShooting).includes("In Auramite Clad"));
  assert.ok(!reminderNames(ownShooting).includes("Vigil Unending"));

  const opponentShooting = battleState({ phase: "shooting", activePlayer: "opponent", detachments });
  assert.ok(reminderNames(opponentShooting).includes("In Auramite Clad"));
  assert.ok(reminderNames(opponentShooting).includes("Vigil Unending"));

  for (const activePlayer of ["you", "opponent"]) {
    const fight = battleState({ phase: "fight", activePlayer, detachments });
    assert.ok(reminderNames(fight).includes("In Auramite Clad"));
    assert.ok(reminderNames(fight).includes("Vigil Unending"));
  }
});

