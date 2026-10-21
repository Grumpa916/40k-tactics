import test from "node:test";
import assert from "node:assert/strict";
import { renderPersistentMissionSummary } from "../../src/ui/mission-summary-panel.js";

function sampleState(overrides = {}) {
  return {
    phase: "command",
    turn: 1,
    activePlayer: "p1",
    battle: { id: "b1", status: "active", round: 1, activePlayerId: "p1" },
    players: [{ id: "p1", name: "You" }, { id: "p2", name: "Opponent" }],
    battlefieldMap: {
      missionSetup: {
        myDisposition: "Take and Hold",
        opponentDisposition: "Disruption",
        layout: "A"
      }
    },
    scoring: {
      secondaryMissionMode: "tactical",
      secondaryMissions: [
        {
          instanceId: "p1:behind-enemy-lines",
          definitionId: "behind-enemy-lines",
          definition: {
            id: "behind-enemy-lines",
            name: "Behind Enemy Lines",
            category: "secondary",
            timing: "end-of-turn",
            description: "Score for qualifying units in the opponent's deployment zone.",
            rulesVerified: false,
            referenceNotes: ["When drawn in the first battle round, a replacement may be drawn."],
            scoringWindows: [
              { timing: "end-of-turn", minRound: 1, tiers: [{ vp: 3, summary: "One qualifying unit" }] }
            ]
          },
          playerId: "p1",
          status: "active",
          drawnRound: 1,
          drawnTurn: 1,
          scoringHistory: []
        },
        {
          instanceId: "p2:display-of-might",
          definitionId: "display-of-might",
          definition: {
            id: "display-of-might",
            name: "Display of Might",
            category: "secondary",
            timing: "end-of-turn",
            scoringWindows: [{ timing: "end-of-turn", tiers: [] }]
          },
          playerId: "p2",
          status: "active",
          drawnRound: 1,
          drawnTurn: 1,
          scoringHistory: []
        }
      ]
    },
    history: [],
    ...overrides
  };
}

test("mission summary starts compact and allows Primary and Secondary sections to expand independently", () => {
  const html = renderPersistentMissionSummary(sampleState(), { perspectivePlayerId: "p1" });
  assert.match(html, /<summary><span>Primary Missions<\/span>/);
  assert.match(html, /<summary><span>Secondary Missions<\/span>/);
  assert.match(html, /data-mission-summary-key="mission-section-primary"/);
  assert.match(html, /data-mission-summary-key="mission-section-secondary"/);
  assert.doesNotMatch(html, /data-mission-summary-key="mission-section-primary" open/);
  assert.doesNotMatch(html, /data-mission-summary-key="mission-section-secondary" open/);
});

test("mission summary shows both primary missions and selected battlefield context", () => {
  const html = renderPersistentMissionSummary(sampleState(), {
    perspectivePlayerId: "p1",
    missionDefinitions: [
      { id: "p1-primary", playerId: "p1", category: "primary", timing: "end-of-turn", victoryPoints: 5 },
      { id: "p2-primary", playerId: "p2", category: "primary", timing: "end-of-opponent-turn", victoryPoints: 5 }
    ]
  });
  assert.match(html, /Determined Acquisition/);
  assert.match(html, /Death Trap/);
  assert.match(html, /Battlefield layout A/);
  assert.match(html, /End of turn/);
  assert.match(html, /Configured award: 5 VP/);
});

test("each player's secondary list and individual card details can expand independently", () => {
  const state = sampleState();
  const html = renderPersistentMissionSummary(state, { perspectivePlayerId: "p1" });
  assert.match(html, /Behind Enemy Lines/);
  assert.match(html, /Display of Might/);
  assert.match(html, /You 1 · Opponent 1/);
  assert.match(html, /data-mission-summary-key="mission-secondary-player-p1"/);
  assert.match(html, /data-mission-summary-key="mission-secondary-player-p2"/);
  assert.match(html, /data-mission-summary-key="mission-secondary-card-p1:behind-enemy-lines"/);
  assert.match(html, /Mission text/);
  assert.match(html, /replacement may be drawn/);
  assert.match(html, /Scoring/);
  assert.match(html, /3 VP/);
  assert.doesNotMatch(html, /not fully verified|Check the printed card/);
});

test("mission summary preserves all independent expanded states after a state refresh", () => {
  const openStates = {
    "mission-section-primary": true,
    "mission-primary-player-p1": true,
    "mission-section-secondary": true,
    "mission-secondary-player-p1": true,
    "mission-secondary-card-p1:behind-enemy-lines": true
  };
  const html = renderPersistentMissionSummary(sampleState(), {
    perspectivePlayerId: "p1",
    openStates
  });
  for (const key of Object.keys(openStates)) {
    assert.match(html, new RegExp('data-mission-summary-key="' + key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + '" open'));
  }
});


test("mission summary displays independent Fixed and Tactical modes for each player", () => {
  const state = sampleState({
    scoring: {
      secondaryMissionMode: "fixed",
      secondaryMissionModeByPlayer: { p1: "fixed", p2: "tactical" },
      secondaryMissions: sampleState().scoring.secondaryMissions
    }
  });
  const html = renderPersistentMissionSummary(state, { perspectivePlayerId: "p1" });
  const youBlock = html.match(/data-mission-summary-key="mission-secondary-player-p1"[^]*?<\/details>/)?.[0] ?? "";
  const opponentBlock = html.match(/data-mission-summary-key="mission-secondary-player-p2"[^]*?<\/details>/)?.[0] ?? "";
  assert.match(youBlock, />fixed<\/span>/);
  assert.match(opponentBlock, />tactical<\/span>/);
});

test("mission summary is display-only and never awards VP or mutates game state", () => {
  const state = sampleState();
  const before = JSON.stringify(state);
  const html = renderPersistentMissionSummary(state, { perspectivePlayerId: "p1" });
  assert.doesNotMatch(html, /Confirm.*VP|Award VP|Score mission/);
  assert.equal(JSON.stringify(state), before);
});
