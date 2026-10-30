import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeStreak, dateKey, daysAgo, lastDays, plural } from '../lib/utils';

const at = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h);

test('dateKey uses local calendar date, not UTC', () => {
  assert.equal(dateKey(at(2026, 10, 30, 1)), '2026-10-30');
  assert.equal(dateKey(at(2026, 1, 5, 23)), '2026-01-05');
});

test('daysAgo crosses month boundaries', () => {
  assert.equal(daysAgo(1, at(2026, 3, 1)), '2026-02-28');
});

test('lastDays returns chronological window ending today', () => {
  const days = lastDays(3);
  assert.equal(days.length, 3);
  assert.equal(days[2], dateKey());
  assert.ok(days[0] < days[1] && days[1] < days[2]);
});

test('computeStreak counts consecutive active days ending today', () => {
  const today = at(2026, 10, 30);
  const on = (...keys: string[]) => Object.fromEntries(keys.map(k => [k, { answered: 3 }]));
  assert.equal(computeStreak(on('2026-10-30', '2026-10-29', '2026-10-28'), today), 3);
});

test('computeStreak keeps a streak alive when today has no activity yet', () => {
  const today = at(2026, 10, 30);
  assert.equal(computeStreak({ '2026-10-29': { answered: 1 }, '2026-10-28': { answered: 1 } }, today), 2);
});

test('computeStreak breaks on a gap and ignores zero-answer days', () => {
  const today = at(2026, 10, 30);
  assert.equal(computeStreak({ '2026-10-30': { answered: 1 }, '2026-10-28': { answered: 5 } }, today), 1);
  assert.equal(computeStreak({ '2026-10-30': { answered: 0 } }, today), 0);
  assert.equal(computeStreak({}, today), 0);
});

test('plural follows Ukrainian rules', () => {
  const p = (n: number) => plural(n, 'день', 'дні', 'днів');
  assert.deepEqual([1, 2, 4, 5, 11, 12, 14, 21, 22, 25, 101, 111].map(p),
    ['день', 'дні', 'дні', 'днів', 'днів', 'днів', 'днів', 'день', 'дні', 'днів', 'день', 'днів']);
});
