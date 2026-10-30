import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import * as store from '../data/programStore';

const mem = new Map<string, string>();
(globalThis as { localStorage?: Storage }).localStorage = {
  getItem: k => mem.get(k) ?? null,
  setItem: (k, v) => { mem.set(k, String(v)); },
  removeItem: k => { mem.delete(k); },
  clear: () => mem.clear(),
  key: i => [...mem.keys()][i] ?? null,
  get length() { return mem.size; },
} as Storage;

const cfg = { goal: 'hypertrophy', level: 2, days: 3, split: 'fullbody', equipment: 'gym' } as const;
const client = { name: 'Олена', notes: 'Ранкові тренування', injuries: ['knee' as const] };

beforeEach(() => mem.clear());

test('createProgram applies client injuries and builds a title', () => {
  const p = store.createProgram({ ...cfg }, client, 'Тренер');
  assert.equal(p.title, 'Олена — гіпертрофія');
  assert.deepEqual(p.cfg.injuries, ['knee']);
  assert.equal(p.days.length, 3);
});

test('save, list, duplicate and delete', () => {
  const p = store.saveProgram(store.createProgram({ ...cfg }, client));
  const copy = store.duplicateProgram(p);
  assert.equal(store.listPrograms().length, 2);
  assert.notEqual(copy.id, p.id);
  assert.match(copy.title, /копія/);
  copy.days[0].exercises[0].name = 'Змінено';
  assert.notEqual(store.listPrograms().find(x => x.id === p.id)!.days[0].exercises[0].name, 'Змінено');
  store.deleteProgram(p.id);
  assert.deepEqual(store.listPrograms().map(x => x.id), [copy.id]);
});

test('legacy single-program save is migrated once', () => {
  mem.set('ia_program', JSON.stringify({ cfg, swaps: {} }));
  const list = store.listPrograms();
  assert.equal(list.length, 1);
  assert.equal(list[0].title, 'Моя програма');
  assert.equal(mem.has('ia_program'), false);
  assert.equal(store.listPrograms().length, 1);
});

test('JSON export round-trips and import gets a fresh id', () => {
  const p = store.createProgram({ ...cfg }, client);
  const back = store.parseProgramJSON(store.exportProgramJSON(p));
  assert.notEqual(back.id, p.id);
  assert.equal(back.title, p.title);
  assert.deepEqual(back.days, p.days);
});

test('import rejects foreign or broken files with a clear message', () => {
  assert.throws(() => store.parseProgramJSON('{"hello":1}'), /не файл програми/);
  assert.throws(() => store.parseProgramJSON(JSON.stringify({ format: 'iron-academy-program', program: { title: 'x', cfg: {}, days: [{ title: 1 }] } })), /пошкоджений/);
  assert.throws(() => store.parseProgramJSON('not json'));
});

test('text export lists days in weekday order with notes', () => {
  const p = store.createProgram({ ...cfg }, client, 'Тренер');
  p.days[0].exercises[0].note = 'темп 3-1-1';
  const txt = store.programToText(p);
  assert.match(txt, /Клієнт: Олена/);
  assert.match(txt, /темп 3-1-1/);
  assert.ok(txt.indexOf('Пн') < txt.indexOf('Ср'));
});
