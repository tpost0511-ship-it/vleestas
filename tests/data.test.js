import assert from 'node:assert/strict';
import test from 'node:test';
import { pointBalance } from '../lib/game.js';

const legacyDemo = {
  groups: [{ id: 'legacy-group', name: 'Oude groep', invite_code: 'LEGACY01' }],
  members: [
    { group_id: 'legacy-group', user_id: 'me', display_name: 'Jij' },
    { group_id: 'legacy-group', user_id: 'friend', display_name: 'Vriend' }
  ],
  challenges: [],
  participations: [],
  shopItems: [],
  shopPurchases: [],
  challengeFunds: [],
  challengeAwards: [],
  dailyBonuses: [],
  rouletteSpins: []
};
const stored = new Map([['puntjacht-demo-v1', JSON.stringify(legacyDemo)]]);
globalThis.window = { PUNTJACHT_CONFIG: {} };
globalThis.localStorage = {
  getItem: key => stored.get(key) || null,
  setItem: (key, value) => stored.set(key, String(value))
};

const { createGroup, joinGroup, loadGroup } = await import('../lib/data.js');

test('legacy members and new groups receive one 100-point starting balance', async () => {
  const legacy = await loadGroup('legacy-group');
  assert.deepEqual(legacy.groupStartingPoints.map(({ user_id, points }) => [user_id, points]), [
    ['me', 100],
    ['friend', 100]
  ]);
  assert.equal(pointBalance('me', legacy.challenges, legacy.participations, [], [], [], [], [], legacy.groupStartingPoints), 100);

  await joinGroup('LEGACY01');
  assert.equal((await loadGroup('legacy-group')).groupStartingPoints.length, 2);

  const newGroupId = await createGroup('Nieuwe groep');
  const newGroup = await loadGroup(newGroupId);
  assert.equal(newGroup.groupStartingPoints.length, 1);
  assert.equal(newGroup.groupStartingPoints[0].points, 100);
});
