import {
  buildProgram, uid, GOALS, LEVELS, SPLITS, WEEKDAYS,
  type ProgramConfig, type ProgramDay, type Injury,
} from './programBuilder';
import { dateKey } from '../lib/utils';

export interface ClientInfo {
  name: string;
  notes: string;
  injuries: Injury[];
}

export interface SavedProgram {
  id: string;
  title: string;
  coach: string;
  client: ClientInfo;
  cfg: ProgramConfig;
  days: ProgramDay[];
  coachNotes: string;
  createdAt: number;
  updatedAt: number;
}

const KEY = 'ia_programs';
const LEGACY_KEY = 'ia_program';
const COACH_KEY = 'ia_coach_name';

export function createProgram(cfg: ProgramConfig, client: ClientInfo, coach = ''): SavedProgram {
  const now = Date.now();
  const goal = GOALS[cfg.goal].label;
  return {
    id: uid('p'),
    title: client.name ? `${client.name} — ${goal.toLowerCase()}` : goal,
    coach,
    client,
    cfg: { ...cfg, injuries: client.injuries },
    days: buildProgram({ ...cfg, injuries: client.injuries }),
    coachNotes: '',
    createdAt: now,
    updatedAt: now,
  };
}

function readAll(): Record<string, SavedProgram> {
  try {
    const all: Record<string, SavedProgram> = JSON.parse(localStorage.getItem(KEY) || '{}');
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const old = JSON.parse(legacy) as { cfg?: ProgramConfig };
      if (old?.cfg) {
        const migrated = createProgram(old.cfg, { name: '', notes: '', injuries: [] });
        migrated.title = 'Моя програма';
        all[migrated.id] = migrated;
        localStorage.setItem(KEY, JSON.stringify(all));
      }
      localStorage.removeItem(LEGACY_KEY);
    }
    return all;
  } catch {
    return {};
  }
}

function writeAll(all: Record<string, SavedProgram>) {
  try { localStorage.setItem(KEY, JSON.stringify(all)); } catch {}
}

export function listPrograms(): SavedProgram[] {
  return Object.values(readAll()).sort((a, b) => b.updatedAt - a.updatedAt);
}

export function saveProgram(p: SavedProgram): SavedProgram {
  const saved = { ...p, updatedAt: Date.now() };
  writeAll({ ...readAll(), [saved.id]: saved });
  return saved;
}

export function deleteProgram(id: string) {
  const all = readAll();
  delete all[id];
  writeAll(all);
}

export function duplicateProgram(p: SavedProgram): SavedProgram {
  const now = Date.now();
  return saveProgram({ ...structuredClone(p), id: uid('p'), title: `${p.title} (копія)`, createdAt: now, updatedAt: now });
}

export function getCoachName(): string {
  try { return localStorage.getItem(COACH_KEY) ?? ''; } catch { return ''; }
}

export function setCoachName(name: string) {
  try { localStorage.setItem(COACH_KEY, name); } catch {}
}

export function exportProgramJSON(p: SavedProgram): string {
  return JSON.stringify({ format: 'iron-academy-program', version: 1, program: p }, null, 2);
}

export function parseProgramJSON(text: string): SavedProgram {
  const data = JSON.parse(text);
  const p = data?.format === 'iron-academy-program' ? data.program : null;
  if (!p || typeof p.title !== 'string' || !Array.isArray(p.days) || !p.cfg) {
    throw new Error('Це не файл програми Iron Academy');
  }
  const valid = p.days.every((d: ProgramDay) =>
    typeof d.weekday === 'number' && typeof d.title === 'string' && Array.isArray(d.exercises) &&
    d.exercises.every(e => typeof e.name === 'string' && typeof e.sets === 'number'));
  if (!valid) throw new Error('Файл пошкоджений: неправильна структура днів');
  const now = Date.now();
  return {
    ...p,
    id: uid('p'),
    coach: p.coach ?? '',
    coachNotes: p.coachNotes ?? '',
    client: { name: p.client?.name ?? '', notes: p.client?.notes ?? '', injuries: p.client?.injuries ?? [] },
    createdAt: now,
    updatedAt: now,
  };
}

export function programFileName(p: SavedProgram): string {
  const base = p.title.replace(/[\\/:*?"<>|]+/g, '').replace(/\s+/g, '-').slice(0, 60) || 'program';
  return `${base}-${dateKey()}.json`;
}

export function programToText(p: SavedProgram): string {
  const cfg = p.cfg;
  const head = [
    p.title,
    p.client.name && `Клієнт: ${p.client.name}`,
    p.coach && `Тренер: ${p.coach}`,
    `${GOALS[cfg.goal].label}, ${LEVELS[cfg.level].label}, ${SPLITS[cfg.split].label}`,
    p.coachNotes && `Нотатки: ${p.coachNotes}`,
  ].filter(Boolean).join('\n');
  const days = [...p.days].sort((a, b) => a.weekday - b.weekday).map(d => {
    const ex = d.exercises.map(e => {
      const rest = e.rest !== '—' ? `, відпочинок ${e.rest}` : '';
      const note = e.note ? ` (${e.note})` : '';
      return `  ${e.name} — ${e.sets}×${e.reps}${rest}${note}`;
    }).join('\n');
    const warm = d.warmup.length ? `\nРозминка: ${d.warmup.map(w => w.drill).join('; ')}` : '';
    return `${WEEKDAYS[d.weekday]} — ${d.title}${warm}\n${ex}`;
  });
  return [head, ...days].join('\n\n');
}
