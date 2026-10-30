'use client';
import { useEffect, useRef, useState } from 'react';
import {
  PATTERNS, INJURIES, WEEKDAYS, DOSE_PRESETS,
  riskFor, newExercise, uid, weeklyVolume, progression, principles,
  type Pattern, type Injury, type Role, type ProgramDay, type ProgramExercise, type DosePreset,
} from '../../data/programBuilder';
import { setCoachName, type SavedProgram } from '../../data/programStore';
import ExercisePicker from './ExercisePicker';

const UNDO_LIMIT = 30;
const COALESCE_MS = 1200;
const INJURY_KEYS = Object.keys(INJURIES) as Injury[];
const VOLUME_ORDER: Pattern[] = ['squat', 'lunge', 'hinge', 'hpush', 'vpush', 'hpull', 'vpull', 'core', 'delts', 'biceps', 'triceps'];
const ROLE_LABEL: Record<Role, string> = { main: 'Основна', secondary: 'Допоміжна', accessory: 'Ізоляція', core: 'Кор', finisher: 'Фінішер' };

type PickerState =
  | { open: false }
  | { open: true; mode: 'add'; dayId: string }
  | { open: true; mode: 'replace'; dayId: string; exId: string; pattern: Pattern };

function applyDose(e: ProgramExercise, d: DosePreset): ProgramExercise {
  return { ...e, sets: d.sets, reps: d.reps, rest: d.rest, rir: d.rir };
}

function roleFor(pattern: Pattern): Role {
  if (pattern === 'core') return 'core';
  if (pattern === 'loco') return 'finisher';
  return 'secondary';
}

function isTyping(el: EventTarget | null) {
  return el instanceof HTMLElement && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName));
}

export default function ProgramEditor({ program, onChange }: { program: SavedProgram; onChange: (p: SavedProgram) => void }) {
  const [picker, setPicker] = useState<PickerState>({ open: false });
  const [undoCount, setUndoCount] = useState(0);
  const undoStack = useRef<SavedProgram[]>([]);
  const lastEdit = useRef<{ key: string; at: number }>({ key: '', at: 0 });
  const programRef = useRef(program);
  programRef.current = program;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  function commit(next: SavedProgram, key = '') {
    const now = Date.now();
    const coalesce = key && lastEdit.current.key === key && now - lastEdit.current.at < COALESCE_MS;
    if (!coalesce) {
      undoStack.current = [...undoStack.current, programRef.current].slice(-UNDO_LIMIT);
      setUndoCount(undoStack.current.length);
    }
    lastEdit.current = { key, at: now };
    onChange(next);
  }

  function undo() {
    const prev = undoStack.current.pop();
    if (!prev) return;
    setUndoCount(undoStack.current.length);
    lastEdit.current = { key: '', at: 0 };
    onChangeRef.current(prev);
  }
  const undoRef = useRef(undo);
  undoRef.current = undo;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === 'z' && !isTyping(e.target)) {
        e.preventDefault();
        undoRef.current();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const set = (patch: Partial<SavedProgram>, key = '') => commit({ ...program, ...patch }, key);
  const setDays = (days: ProgramDay[], key = '') => set({ days }, key);
  const updateDay = (dayId: string, fn: (d: ProgramDay) => ProgramDay, key = '') =>
    setDays(program.days.map(d => (d.id === dayId ? fn(d) : d)), key);
  const updateEx = (dayId: string, exId: string, fn: (e: ProgramExercise) => ProgramExercise, key = '') =>
    updateDay(dayId, d => ({ ...d, exercises: d.exercises.map(e => (e.id === exId ? fn(e) : e)) }), key);

  const injuries = program.client.injuries;
  const days = program.days
    .map((d, i) => ({ d, i }))
    .sort((a, b) => a.d.weekday - b.d.weekday || a.i - b.i)
    .map(x => x.d);
  const usedWeekdays = new Set(program.days.map(d => d.weekday));
  const weekdayCount = program.days.reduce<Record<number, number>>((acc, d) => ({ ...acc, [d.weekday]: (acc[d.weekday] ?? 0) + 1 }), {});
  const freeWeekday = WEEKDAYS.findIndex((_, i) => !usedWeekdays.has(i));

  function toggleInjury(inj: Injury) {
    const next = injuries.includes(inj) ? injuries.filter(i => i !== inj) : [...injuries, inj];
    set({ client: { ...program.client, injuries: next }, cfg: { ...program.cfg, injuries: next } });
  }

  function addDay() {
    if (freeWeekday < 0) return;
    const day: ProgramDay = { id: uid('d'), weekday: freeWeekday, title: 'Новий день', focus: 'full', warmup: [], exercises: [] };
    setDays([...program.days, day]);
  }

  function duplicateDay(day: ProgramDay) {
    const copy: ProgramDay = {
      ...structuredClone(day),
      id: uid('d'),
      weekday: freeWeekday >= 0 ? freeWeekday : day.weekday,
      title: `${day.title} (копія)`,
      exercises: day.exercises.map(e => ({ ...e, id: uid('e') })),
    };
    setDays([...program.days, copy]);
  }

  function deleteDay(day: ProgramDay) {
    if (!window.confirm(`Видалити день «${day.title}» разом з ${day.exercises.length} вправами?`)) return;
    setDays(program.days.filter(d => d.id !== day.id));
  }

  function moveEx(dayId: string, exId: string, dir: -1 | 1) {
    updateDay(dayId, d => {
      const i = d.exercises.findIndex(e => e.id === exId);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= d.exercises.length) return d;
      const list = [...d.exercises];
      [list[i], list[j]] = [list[j], list[i]];
      return { ...d, exercises: list };
    });
  }

  function onPick(name: string, pattern: Pattern) {
    if (!picker.open) return;
    if (picker.mode === 'replace') {
      updateEx(picker.dayId, picker.exId, e => ({ ...e, name, pattern }));
    } else {
      updateDay(picker.dayId, d => ({ ...d, exercises: [...d.exercises, newExercise(pattern, name, roleFor(pattern))] }));
    }
    setPicker({ open: false });
  }

  return (
    <div className="pe">
      <div className="pe-toolbar">
        <button type="button" className="btn-secondary pe-undo" onClick={undo} disabled={undoCount === 0} title="Ctrl/Cmd + Z">
          ↶ Скасувати{undoCount > 0 ? ` (${undoCount})` : ''}
        </button>
      </div>

      <MetaBlock program={program} set={set} toggleInjury={toggleInjury} />

      <div className="pe-days">
        {days.map(day => (
          <DayCard
            key={day.id}
            day={day}
            injuries={injuries}
            weekdayClash={(weekdayCount[day.weekday] ?? 0) > 1}
            updateDay={(fn, key) => updateDay(day.id, fn, key)}
            updateEx={(exId, fn, key) => updateEx(day.id, exId, fn, key)}
            moveEx={(exId, dir) => moveEx(day.id, exId, dir)}
            onDuplicate={() => duplicateDay(day)}
            onDelete={() => deleteDay(day)}
            onAddExercise={() => setPicker({ open: true, mode: 'add', dayId: day.id })}
            onReplace={e => setPicker({ open: true, mode: 'replace', dayId: day.id, exId: e.id, pattern: e.pattern })}
          />
        ))}
      </div>

      <button type="button" className="btn-secondary pe-add-day" onClick={addDay} disabled={freeWeekday < 0}>
        {freeWeekday < 0 ? 'Усі дні тижня зайняті' : `+ Додати день (${WEEKDAYS[freeWeekday]})`}
      </button>

      <Analysis program={program} />

      <ExercisePicker
        open={picker.open}
        mode={picker.open ? picker.mode : 'add'}
        pattern={picker.open && picker.mode === 'replace' ? picker.pattern : undefined}
        equipment={program.cfg.equipment}
        injuries={injuries}
        onPick={onPick}
        onClose={() => setPicker({ open: false })}
      />
    </div>
  );
}

function MetaBlock({ program, set, toggleInjury }: {
  program: SavedProgram;
  set: (patch: Partial<SavedProgram>, key?: string) => void;
  toggleInjury: (i: Injury) => void;
}) {
  const client = program.client;
  return (
    <section className="pe-meta" aria-label="Програма і клієнт">
      <label className="pe-field pe-field-wide">
        <span className="pe-label">Назва програми</span>
        <input className="pe-input pe-title-input" value={program.title} onChange={e => set({ title: e.target.value }, 'title')} />
      </label>
      <label className="pe-field">
        <span className="pe-label">Клієнт</span>
        <input className="pe-input" value={client.name} placeholder="Ім'я клієнта" onChange={e => set({ client: { ...client, name: e.target.value } }, 'client-name')} />
      </label>
      <label className="pe-field">
        <span className="pe-label">Тренер</span>
        <input
          className="pe-input"
          value={program.coach}
          placeholder="Твоє ім'я"
          onChange={e => { setCoachName(e.target.value); set({ coach: e.target.value }, 'coach'); }}
        />
      </label>
      <div className="pe-field pe-field-wide">
        <span className="pe-label" id="pe-inj-label">Обмеження клієнта</span>
        <div className="pe-chips" role="group" aria-labelledby="pe-inj-label">
          {INJURY_KEYS.map(i => (
            <button
              key={i}
              type="button"
              className={`pe-chip${client.injuries.includes(i) ? ' on' : ''}`}
              aria-pressed={client.injuries.includes(i)}
              title={INJURIES[i].desc}
              onClick={() => toggleInjury(i)}
            >
              {INJURIES[i].label}
            </button>
          ))}
        </div>
      </div>
      <label className="pe-field">
        <span className="pe-label">Про клієнта (бачиш лише ти)</span>
        <textarea className="pe-input pe-textarea" value={client.notes} placeholder="Анамнез, цілі, вподобання…" onChange={e => set({ client: { ...client, notes: e.target.value } }, 'client-notes')} />
      </label>
      <label className="pe-field">
        <span className="pe-label">Нотатки для клієнта</span>
        <textarea className="pe-input pe-textarea" value={program.coachNotes} placeholder="Буде надруковано в програмі" onChange={e => set({ coachNotes: e.target.value }, 'coach-notes')} />
      </label>
    </section>
  );
}

function DayCard({ day, injuries, weekdayClash, updateDay, updateEx, moveEx, onDuplicate, onDelete, onAddExercise, onReplace }: {
  day: ProgramDay;
  injuries: Injury[];
  weekdayClash: boolean;
  updateDay: (fn: (d: ProgramDay) => ProgramDay, key?: string) => void;
  updateEx: (exId: string, fn: (e: ProgramExercise) => ProgramExercise, key?: string) => void;
  moveEx: (exId: string, dir: -1 | 1) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onAddExercise: () => void;
  onReplace: (e: ProgramExercise) => void;
}) {
  function applyDayPreset(id: string) {
    const d = DOSE_PRESETS.find(p => p.id === id);
    if (!d) return;
    updateDay(day => ({ ...day, exercises: day.exercises.map(e => (e.role === 'core' || e.role === 'finisher' ? e : applyDose(e, d))) }));
  }

  return (
    <section className="pe-day" aria-label={`${WEEKDAYS[day.weekday]}, ${day.title}`}>
      <div className="pe-day-head">
        <select
          className="pe-input pe-weekday"
          value={day.weekday}
          aria-label="День тижня"
          onChange={e => updateDay(d => ({ ...d, weekday: Number(e.target.value) }))}
        >
          {WEEKDAYS.map((w, i) => <option key={w} value={i}>{w}</option>)}
        </select>
        <input
          className="pe-input pe-day-title"
          value={day.title}
          aria-label="Назва дня"
          onChange={e => updateDay(d => ({ ...d, title: e.target.value }), `day-title-${day.id}`)}
        />
        <div className="pe-day-actions">
          <button type="button" className="pe-icon-btn" onClick={onDuplicate} aria-label="Дублювати день" title="Дублювати день">⧉</button>
          <button type="button" className="pe-icon-btn pe-danger" onClick={onDelete} aria-label="Видалити день" title="Видалити день">🗑</button>
        </div>
      </div>
      {weekdayClash && <p className="pe-warn">На цей день тижня вже є інше тренування.</p>}

      <div className="pe-day-tools">
        <label className="pe-inline">
          <span className="pe-label">Пресет для дня</span>
          <select className="pe-input" value="" onChange={e => applyDayPreset(e.target.value)}>
            <option value="">Обрати…</option>
            {DOSE_PRESETS.map(p => <option key={p.id} value={p.id}>{p.label}: {p.sets}×{p.reps}</option>)}
          </select>
        </label>
        <input
          className="pe-input pe-day-note"
          value={day.note ?? ''}
          placeholder="Нотатка до дня (необов'язково)"
          aria-label="Нотатка до дня"
          onChange={e => updateDay(d => ({ ...d, note: e.target.value }), `day-note-${day.id}`)}
        />
      </div>

      {day.warmup.length > 0 && (
        <details className="pb-warmup">
          <summary>Розминка Joint-by-Joint, 5–7 хв</summary>
          <ul>
            {day.warmup.map(w => (
              <li key={w.joint}>
                <span className={`pb-need ${w.need === 'мобільність' ? 'mob' : 'stab'}`}>{w.joint}: {w.need}</span>
                <span>{w.drill}</span>
              </li>
            ))}
          </ul>
        </details>
      )}

      {day.exercises.length === 0 && <p className="pe-empty">Немає вправ. Додай першу вправу.</p>}
      <ol className="pe-ex-list">
        {day.exercises.map((e, i) => (
          <ExerciseRow
            key={e.id}
            ex={e}
            risk={riskFor(e.name, injuries)}
            first={i === 0}
            last={i === day.exercises.length - 1}
            update={(fn, key) => updateEx(e.id, fn, key)}
            onMove={dir => moveEx(e.id, dir)}
            onDelete={() => updateDay(d => ({ ...d, exercises: d.exercises.filter(x => x.id !== e.id) }))}
            onReplace={() => onReplace(e)}
          />
        ))}
      </ol>
      <button type="button" className="pe-add-ex" onClick={onAddExercise}>+ Додати вправу</button>
    </section>
  );
}

function ExerciseRow({ ex, risk, first, last, update, onMove, onDelete, onReplace }: {
  ex: ProgramExercise;
  risk: Injury[];
  first: boolean;
  last: boolean;
  update: (fn: (e: ProgramExercise) => ProgramExercise, key?: string) => void;
  onMove: (dir: -1 | 1) => void;
  onDelete: () => void;
  onReplace: () => void;
}) {
  const field = (k: 'reps' | 'rest' | 'rir', label: string, cls = '') => (
    <label className={`pe-dose-field ${cls}`}>
      <span className="pe-label">{label}</span>
      <input className="pe-input" value={ex[k]} onChange={e => update(x => ({ ...x, [k]: e.target.value }), `${ex.id}-${k}`)} />
    </label>
  );

  return (
    <li className="pe-ex" style={{ '--pat': PATTERNS[ex.pattern].color } as React.CSSProperties}>
      <div className="pe-ex-top">
        <div className="pe-ex-id">
          <span className="pe-ex-pat">{PATTERNS[ex.pattern].label}<span className="pe-ex-role"> / {ROLE_LABEL[ex.role]}</span></span>
          <button type="button" className="pe-ex-name" onClick={onReplace} title="Замінити вправу">
            {ex.name} <span className="pe-ex-swap" aria-hidden="true">⇄</span>
          </button>
          {risk.length > 0 && <span className="pe-risk">⚠ {risk.map(r => INJURIES[r].label).join(', ')}</span>}
        </div>
        <div className="pe-ex-actions">
          <button type="button" className="pe-icon-btn" onClick={() => onMove(-1)} disabled={first} aria-label="Перемістити вище">↑</button>
          <button type="button" className="pe-icon-btn" onClick={() => onMove(1)} disabled={last} aria-label="Перемістити нижче">↓</button>
          <button type="button" className="pe-icon-btn pe-danger" onClick={onDelete} aria-label={`Видалити ${ex.name}`}>✕</button>
        </div>
      </div>

      <div className="pe-dose">
        <label className="pe-dose-field pe-dose-sets">
          <span className="pe-label">Підходи</span>
          <input
            className="pe-input"
            type="number"
            min={1}
            max={10}
            value={ex.sets}
            onChange={e => {
              const n = parseInt(e.target.value, 10);
              if (!Number.isNaN(n)) update(x => ({ ...x, sets: Math.min(10, Math.max(1, n)) }), `${ex.id}-sets`);
            }}
          />
        </label>
        {field('reps', 'Повтори')}
        {field('rest', 'Відпочинок')}
        {field('rir', 'RIR', 'pe-dose-rir')}
        <label className="pe-dose-field pe-dose-preset">
          <span className="pe-label">Пресет</span>
          <select
            className="pe-input"
            value=""
            onChange={e => {
              const d = DOSE_PRESETS.find(p => p.id === e.target.value);
              if (d) update(x => applyDose(x, d));
            }}
          >
            <option value="">Обрати…</option>
            {DOSE_PRESETS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </label>
      </div>

      <input
        className="pe-input pe-note"
        value={ex.note ?? ''}
        placeholder="Темп, підказки техніки…"
        aria-label={`Нотатка до ${ex.name}`}
        onChange={e => update(x => ({ ...x, note: e.target.value }), `${ex.id}-note`)}
      />
    </li>
  );
}

function Analysis({ program }: { program: SavedProgram }) {
  const vol = weeklyVolume(program.days);
  const maxVol = Math.max(...Object.values(vol).map(v => v ?? 0), 1);
  const push = (vol.hpush ?? 0) + (vol.vpush ?? 0);
  const pull = (vol.hpull ?? 0) + (vol.vpull ?? 0);
  const ratio = pull ? push / pull : 0;
  const balanced = (push === 0 && pull === 0) || (ratio >= 0.75 && ratio <= 1.34);
  const risky = program.days.flatMap(d => d.exercises).filter(e => riskFor(e.name, program.client.injuries).length > 0);

  return (
    <div className="pe-analysis">
      <section className="pb-panel">
        <h3 className="pb-panel-title">Обсяг за тиждень</h3>
        <p className="pb-panel-note">Робочі підходи на кожен шаблон руху</p>
        {VOLUME_ORDER.filter(p => vol[p]).map(p => (
          <div key={p} className="pb-vol-row">
            <span className="pb-vol-name">{PATTERNS[p].label}</span>
            <span className="pb-vol-bar-wrap"><span className="pb-vol-bar" style={{ width: `${((vol[p] ?? 0) / maxVol) * 100}%`, background: PATTERNS[p].color }} /></span>
            <span className="pb-vol-n">{vol[p]}</span>
          </div>
        ))}
        <p className={`pb-balance ${balanced ? 'ok' : 'warn'}`}>
          Жими : тяги = {push} : {pull}. {balanced ? 'Баланс в нормі.' : 'Дисбаланс — заміни або додай вправу протилежного патерну.'}
        </p>
        <p className={`pb-balance ${risky.length ? 'warn' : 'ok'}`}>
          {risky.length
            ? `Вправ з ризиком для клієнта: ${risky.length}. Заміни позначені ⚠.`
            : 'Немає вправ, що суперечать обмеженням клієнта.'}
        </p>
      </section>

      <section className="pb-panel">
        <h3 className="pb-panel-title">Прогресія на 4 тижні</h3>
        <ol className="pb-prog">
          {progression(program.cfg.goal, program.cfg.level).map(p => (
            <li key={p.week}><strong>{p.week}</strong><span>{p.text}</span></li>
          ))}
        </ol>
      </section>

      <section className="pb-panel pb-why">
        <h3 className="pb-panel-title">Чому програма саме така</h3>
        <dl>
          {principles(program.cfg).map(p => (
            <div key={p.title}><dt>{p.title}</dt><dd>{p.text}</dd></div>
          ))}
        </dl>
      </section>
    </div>
  );
}
