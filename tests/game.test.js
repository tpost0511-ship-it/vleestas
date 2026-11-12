import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DAILY_CHALLENGE_BONUS,
  amsterdamDateKey,
  pointBalance,
  ranking,
  rouletteBetWins,
  rouletteColor,
  rouletteGrossPayout,
  validRouletteBets
} from '../lib/game.js';

test('daily bonus date uses Amsterdam midnight', () => {
  assert.equal(DAILY_CHALLENGE_BONUS, 25);
  assert.equal(amsterdamDateKey(new Date('2026-11-12T22:30:00Z')), '2026-11-12');
  assert.equal(amsterdamDateKey(new Date('2026-11-12T23:30:00Z')), '2026-11-13');
});

test('roulette uses standard European colors and outside-bet zero rules', () => {
  assert.equal(rouletteColor(0), 'green');
  assert.equal(rouletteColor(1), 'red');
  assert.equal(rouletteColor(2), 'black');
  assert.equal(rouletteBetWins('red', undefined, 0), false);
  assert.equal(rouletteBetWins('odd', undefined, 0), false);
  assert.equal(rouletteBetWins('number', 0, 0), true);
});

test('roulette pays gross returns at standard number and dozen odds', () => {
  assert.equal(rouletteGrossPayout([
    { type: 'number', value: 17, stake: 10 },
    { type: 'red', stake: 5 },
    { type: 'dozen2', stake: 2 }
  ], 17), 366);
  assert.equal(rouletteGrossPayout([{ type: 'number', value: 0, stake: 1 }], 0), 36);
});

test('roulette rejects invalid bets and stakes above the point balance', () => {
  assert.match(validRouletteBets([{ type: 'number', value: 37, stake: 1 }], 10), /getal van 0 tot en met 36/);
  assert.match(validRouletteBets([{ type: 'red', stake: 11 }], 10), /niet genoeg punten/);
  assert.match(validRouletteBets([{ type: 'red', stake: 0 }], 10), /minimaal 1 punt/);
});

test('starting points and roulette affect only the wallet while daily bonus also affects the leaderboard', () => {
  const members = [{ id: 'me', display_name: 'Jij' }, { id: 'other', display_name: 'Ander' }];
  const challenges = [{ id: 'c1', points: 100 }];
  const participations = [{ challenge_id: 'c1', user_id: 'me', status: 'approved' }];
  const bonuses = [{ group_id: 'g1', user_id: 'me', points: DAILY_CHALLENGE_BONUS }];
  const spins = [{ group_id: 'g1', user_id: 'me', stake: 20, payout: 40 }];
  const startingPoints = [{ group_id: 'g1', user_id: 'me', points: 100 }, { group_id: 'g1', user_id: 'other', points: 100 }];

  assert.equal(pointBalance('me', challenges, participations, [], [], [], bonuses, spins, startingPoints), 245);
  assert.equal(ranking(members, challenges, participations, bonuses)[0].points, 125);
});
