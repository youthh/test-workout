import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildProgram, weeklyVolume, recommendedSplit, splitAvailable, SPLITS, riskFor, EXERCISES, DOSE_PRESETS,
  type Goal, type Injury, type Level, type Equipment, type Split,
} from '../data/programBuilder';

const GOALS: Goal[] = ['fatloss', 'hypertrophy', 'strength', 'general'];
const LEVELS: Level[] = [1, 2, 3];
const EQUIPMENT: Equipment[] = ['gym', 'dumbbells', 'bodyweight'];

function* configs() {
  for (const goal of GOALS) for (const level of LEVELS) for (const equipment of EQUIPMENT)
    for (const split of Object.keys(SPLITS) as Split[]) for (const days of SPLITS[split].days)
      yield { goal, level, equipment, split, days };
}

test('every configuration builds the right number of days with exercises', () => {
  for (const cfg of configs()) {
    const p = buildProgram(cfg);
    assert.equal(p.length, cfg.days, JSON.stringify(cfg));
    for (const d of p) assert.ok(d.exercises.length >= 3, `${JSON.stringify(cfg)} ${d.title}`);
  }
});

test('no exercise repeats within a day', () => {
  for (const cfg of configs()) for (const d of buildProgram(cfg)) {
    const names = d.exercises.map(e => e.name);
    assert.equal(new Set(names).size, names.length, `${JSON.stringify(cfg)} ${d.title}: ${names.join(', ')}`);
  }
});

test('weekly pushing and pulling volume stay balanced', () => {
  for (const cfg of configs()) {
    const v = weeklyVolume(buildProgram(cfg));
    const push = (v.hpush ?? 0) + (v.vpush ?? 0);
    const pull = (v.hpull ?? 0) + (v.vpull ?? 0);
    if (!pull) continue;
    assert.ok(push / pull >= 0.75 && push / pull <= 1.34, `${JSON.stringify(cfg)} push ${push} pull ${pull}`);
  }
});

test('recommended split is always available for that number of days', () => {
  for (const level of LEVELS) for (const days of [2, 3, 4, 5, 6])
    assert.ok(splitAvailable(recommendedSplit(level, days), days), `L${level} ${days}d`);
});

test('injuries exclude risky exercises in every configuration', () => {
  const injuries: Injury[] = ['knee', 'lowerback', 'shoulder'];
  for (const cfg of configs()) for (const d of buildProgram({ ...cfg, injuries })) for (const e of d.exercises)
    assert.deepEqual(riskFor(e.name, injuries), [], `${JSON.stringify(cfg)}: ${e.name}`);
});

test('exercise and day ids are unique across the program', () => {
  for (const cfg of configs()) {
    const p = buildProgram(cfg);
    const ids = p.flatMap(d => d.exercises.map(e => e.id));
    assert.equal(new Set(ids).size, ids.length);
    assert.equal(new Set(p.map(d => d.id)).size, p.length);
  }
});

test('catalog marks risky exercises and presets are complete', () => {
  assert.ok(EXERCISES.find(e => e.name === 'Станова тяга')!.avoid.includes('lowerback'));
  assert.ok(EXERCISES.length > 60);
  for (const d of DOSE_PRESETS) assert.ok(d.sets >= 1 && d.reps && d.rest && d.rir);
});

test('beginners get easier sets: fewer sets and more reps in reserve', () => {
  const base = { goal: 'strength' as Goal, equipment: 'gym' as Equipment, split: 'fullbody' as Split, days: 3 };
  const beg = buildProgram({ ...base, level: 1 })[0].exercises[0];
  const mid = buildProgram({ ...base, level: 2 })[0].exercises[0];
  assert.ok(beg.sets < mid.sets);
  assert.equal(beg.rir, '2–3');
});
