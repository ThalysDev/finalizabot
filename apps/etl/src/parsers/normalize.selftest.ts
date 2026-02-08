import { normalizeShotsFromSofaScore } from './normalize.js';

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(`Assert failed: ${msg}`);
}

function testGoalsOnly(): void {
  const json = {
    events: [
      { id: 'e1', type: 'shot', outcome: 'goal', playerId: 'p1', teamId: 't1', minute: 23, xg: 0.8 },
      { id: 'e2', type: 'goal', outcome: 'goal', playerId: 'p2', teamId: 't1', minute: 67 },
    ],
  };
  const shots = normalizeShotsFromSofaScore('m1', json);
  assert(shots.length === 2, 'goals only: length 2');
  assert(shots[0].outcome === 'goal' && shots[0].minute === 23 && shots[0].xg === 0.8, 'goals only: first shot');
  assert(shots[1].outcome === 'goal' && shots[1].id === 'm1:e2', 'goals only: second id');
}

function testBlockedAndOff(): void {
  const json = {
    events: [
      { incidentId: 'b1', type: 'shot', outcome: 'blocked', playerId: 'p1', teamId: 't1', minute: 10 },
      { id: 'o1', eventType: 'shot', outcome: 'off', playerId: 'p2', teamId: 't2', minute: 15 },
    ],
  };
  const shots = normalizeShotsFromSofaScore('m2', json);
  assert(shots.length === 2, 'blocked/off: length 2');
  assert(shots[0].outcome === 'blocked', 'blocked/off: first blocked');
  assert(shots[1].outcome === 'off_target', 'blocked/off: second off_target');
}

function testMixAndMissingFields(): void {
  const json = [
    { type: 'shot', outcome: 'on', playerId: 'p1', teamId: 't1' },
    { type: 'shot', outcome: 'unknown_outcome', bodyPart: 'head', situation: 'penalty' },
  ];
  const shots = normalizeShotsFromSofaScore('m3', json);
  assert(shots.length === 2, 'mix: length 2');
  assert(shots[0].outcome === 'on_target' && shots[0].minute === 0, 'mix: on_target and default minute');
  assert(shots[1].outcome === 'unknown' && shots[1].bodyPart === 'head' && shots[1].situation === 'penalty', 'mix: unknown outcome and mapped body/situation');
}

function run(): void {
  testGoalsOnly();
  testBlockedAndOff();
  testMixAndMissingFields();
  console.log('normalize.selftest: all 3 scenarios passed');
}

run();
