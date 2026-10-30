import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sm2, newCard, todayStr } from '../data/srs';
import { daysAgo } from '../lib/utils';

test('new card is due today', () => {
  assert.equal(newCard('spine', 0).nextReview, todayStr());
});

test('SM-2 intervals grow 1 → 6 → ×EF on easy answers', () => {
  let c = sm2(newCard('spine', 0), 5);
  assert.equal(c.interval, 1);
  c = sm2(c, 5);
  assert.equal(c.interval, 6);
  const efBefore = c.easeFactor;
  c = sm2(c, 5);
  assert.equal(c.interval, Math.round(6 * efBefore));
});

test('forgetting resets repetitions and interval', () => {
  let c = sm2(sm2(newCard('spine', 0), 5), 5);
  c = sm2(c, 1);
  assert.equal(c.repetitions, 0);
  assert.equal(c.interval, 1);
  assert.equal(c.nextReview, daysAgo(-1));
});

test('ease factor never drops below 1.3', () => {
  let c = newCard('spine', 0);
  for (let i = 0; i < 20; i++) c = sm2(c, 1);
  assert.ok(c.easeFactor >= 1.3);
});
