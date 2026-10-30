export type Goal = 'fatloss' | 'hypertrophy' | 'strength' | 'general';
export type Level = 1 | 2 | 3;
export type Equipment = 'gym' | 'dumbbells' | 'bodyweight';
export type Split = 'fullbody' | 'upperlower' | 'ppl' | 'bro';
export type Pattern =
  | 'squat' | 'lunge' | 'hinge' | 'hpush' | 'vpush' | 'hpull' | 'vpull'
  | 'core' | 'loco' | 'delts' | 'biceps' | 'triceps';
export type Role = 'main' | 'secondary' | 'accessory' | 'core' | 'finisher';
export type Injury = 'knee' | 'lowerback' | 'shoulder';

export const INJURIES: Record<Injury, { label: string; desc: string }> = {
  knee:      { label: 'Коліна', desc: 'Без стрибків, пістолетів і глибоких навантажених випадів.' },
  lowerback: { label: 'Поперек', desc: 'Без осьового навантаження і тяг у нахилі без опори.' },
  shoulder:  { label: 'Плечі', desc: 'Без жимів над головою зі штангою і віджимань від лавки.' },
};

export interface ProgramConfig {
  goal: Goal;
  level: Level;
  days: number;
  split: Split;
  equipment: Equipment;
  injuries?: Injury[];
}

interface Exercise { name: string; level: Level; eq: Equipment[] }

const AVOID: Record<string, Injury[]> = {
  'Присід зі стрибком': ['knee'],
  'Пістолет до ящика': ['knee'],
  'Присід на одній нозі з ящика': ['knee'],
  'Болгарський спліт-присід': ['knee'],
  'Болгарський спліт-присід зі штангою': ['knee', 'lowerback'],
  'Ходьба у випадах з гантелями': ['knee'],
  'Присід зі штангою на спині': ['lowerback'],
  'Присід зі штангою з паузою': ['lowerback', 'knee'],
  'Гуд-морнінг з власною вагою': ['lowerback'],
  'Румунська тяга зі штангою': ['lowerback'],
  'Станова тяга': ['lowerback'],
  'Тяга штанги в нахилі': ['lowerback'],
  'Тяга гантелей у нахилі': ['lowerback'],
  'Розкатка ролика для преса': ['lowerback', 'shoulder'],
  'Підйом ніг у висі': ['lowerback'],
  'Берпі, інтервали': ['knee', 'lowerback'],
  'Скакалка, інтервали': ['knee'],
  'Жим штанги стоячи': ['shoulder', 'lowerback'],
  'Жимовий швунг': ['shoulder', 'lowerback'],
  'Пайк-відтискання': ['shoulder'],
  'Відтискання в стійці на руках біля стіни': ['shoulder'],
  'Зворотні відтискання від лавки': ['shoulder'],
  'Підтягування з обтяженням': ['shoulder'],
};

const ALL: Equipment[] = ['gym', 'dumbbells', 'bodyweight'];
const G: Equipment[] = ['gym'];
const GD: Equipment[] = ['gym', 'dumbbells'];
const B: Equipment[] = ['bodyweight'];
const DB: Equipment[] = ['dumbbells', 'bodyweight'];

export const PATTERNS: Record<Pattern, { label: string; color: string }> = {
  squat:   { label: 'Присідання',      color: '#ff7b00' },
  lunge:   { label: 'Випад',           color: '#ff7b00' },
  hinge:   { label: 'Нахил',           color: '#ff7b00' },
  hpush:   { label: 'Жим горизонт.',   color: '#e63946' },
  vpush:   { label: 'Жим вертик.',     color: '#e63946' },
  hpull:   { label: 'Тяга горизонт.',  color: '#4a9eff' },
  vpull:   { label: 'Тяга вертик.',    color: '#4a9eff' },
  core:    { label: 'Рухи тулуба',     color: '#a78bfa' },
  loco:    { label: 'Локомоція',       color: '#3ecf8e' },
  delts:   { label: 'Дельти',          color: '#9a9a9a' },
  biceps:  { label: 'Біцепс',          color: '#9a9a9a' },
  triceps: { label: 'Трицепс',         color: '#9a9a9a' },
};

const EX: Record<Pattern, Exercise[]> = {
  squat: [
    { name: 'Гоблет-присід', level: 1, eq: GD },
    { name: 'Присід до лавки', level: 1, eq: ALL },
    { name: 'Жим ногами в тренажері', level: 1, eq: G },
    { name: 'Присід з гантелями', level: 2, eq: GD },
    { name: 'Фронтальний присід', level: 2, eq: G },
    { name: 'Присід зі штангою на спині', level: 2, eq: G },
    { name: 'Присід зі стрибком', level: 2, eq: B },
    { name: 'Присід зі штангою з паузою', level: 3, eq: G },
    { name: 'Пістолет до ящика', level: 3, eq: DB },
  ],
  lunge: [
    { name: 'Спліт-присід з опорою (TRX)', level: 1, eq: ALL },
    { name: 'Випад назад', level: 1, eq: ALL },
    { name: 'Зашагування на тумбу', level: 2, eq: ALL },
    { name: 'Ходьба у випадах з гантелями', level: 2, eq: GD },
    { name: 'Болгарський спліт-присід', level: 2, eq: ALL },
    { name: 'Присід на одній нозі з ящика', level: 3, eq: DB },
    { name: 'Болгарський спліт-присід зі штангою', level: 3, eq: G },
  ],
  hinge: [
    { name: 'Нахил з обтяженням на грудях', level: 1, eq: GD },
    { name: 'Ягідний міст', level: 1, eq: ALL },
    { name: 'Гуд-морнінг з власною вагою', level: 1, eq: B },
    { name: 'Румунська тяга з гантелями', level: 2, eq: GD },
    { name: 'Румунська тяга зі штангою', level: 2, eq: G },
    { name: 'Хіп-траст зі штангою', level: 2, eq: G },
    { name: 'Ягідний міст на одній нозі', level: 2, eq: DB },
    { name: 'Станова тяга', level: 3, eq: G },
    { name: 'Румунська тяга на одній нозі', level: 3, eq: DB },
  ],
  hpush: [
    { name: 'Відтискання з піднесення', level: 1, eq: ALL },
    { name: 'Жим у тренажері від грудей', level: 1, eq: G },
    { name: 'Жим гантелей лежачи', level: 2, eq: GD },
    { name: 'Відтискання від підлоги', level: 2, eq: DB },
    { name: 'Жим штанги лежачи', level: 2, eq: G },
    { name: 'Жим гантелей на похилій лаві', level: 2, eq: GD },
    { name: 'Відтискання з ногами на піднесенні', level: 3, eq: DB },
    { name: 'Жим штанги лежачи з паузою', level: 3, eq: G },
  ],
  vpush: [
    { name: 'Жим у тренажері сидячи', level: 1, eq: G },
    { name: 'Жим гантелей сидячи', level: 1, eq: GD },
    { name: 'Пайк-відтискання з піднесення', level: 1, eq: B },
    { name: 'Жим гантелі однією рукою стоячи', level: 2, eq: GD },
    { name: 'Пайк-відтискання', level: 2, eq: B },
    { name: 'Жим штанги стоячи', level: 2, eq: G },
    { name: 'Жимовий швунг', level: 3, eq: G },
    { name: 'Відтискання в стійці на руках біля стіни', level: 3, eq: DB },
  ],
  hpull: [
    { name: 'Горизонтальна тяга в блоці сидячи', level: 1, eq: G },
    { name: 'Перевернута тяга в петлях (TRX)', level: 1, eq: DB },
    { name: 'Тяга гантелі однією рукою з опорою', level: 1, eq: GD },
    { name: 'Тяга гантелей у нахилі', level: 2, eq: GD },
    { name: 'Австралійські підтягування', level: 2, eq: B },
    { name: 'Тяга штанги в нахилі', level: 3, eq: G },
    { name: 'Перевернута тяга з ногами на піднесенні', level: 3, eq: DB },
  ],
  vpull: [
    { name: 'Вертикальна тяга в блоці', level: 1, eq: G },
    { name: 'Негативні підтягування', level: 1, eq: DB },
    { name: 'Підтягування з гумовою петлею', level: 2, eq: ALL },
    { name: 'Підтягування', level: 2, eq: ALL },
    { name: 'Підтягування з обтяженням', level: 3, eq: GD },
    { name: 'Підтягування з паузою вгорі', level: 3, eq: B },
  ],
  core: [
    { name: 'Мертвий жук', level: 1, eq: ALL },
    { name: 'Планка', level: 1, eq: ALL },
    { name: 'Пташка-собака', level: 1, eq: ALL },
    { name: 'Бічна планка', level: 1, eq: ALL },
    { name: 'Палоф-прес', level: 2, eq: G },
    { name: 'Hollow hold', level: 2, eq: ALL },
    { name: 'Прогулянка фермера', level: 2, eq: GD },
    { name: 'Розкатка ролика для преса', level: 3, eq: ALL },
    { name: 'Підйом ніг у висі', level: 3, eq: ALL },
  ],
  loco: [
    { name: 'Ходьба під нахилом на доріжці', level: 1, eq: G },
    { name: 'Ведмежа хода', level: 1, eq: DB },
    { name: 'Інтервали на велотренажері', level: 2, eq: G },
    { name: 'Інтервали на гребному тренажері', level: 2, eq: G },
    { name: 'Скакалка, інтервали', level: 2, eq: DB },
    { name: 'Берпі, інтервали', level: 3, eq: DB },
  ],
  delts: [
    { name: 'Розведення гантелей у сторони', level: 1, eq: GD },
    { name: 'Тяга канату до обличчя', level: 1, eq: G },
    { name: 'Y-підйоми лежачи на животі', level: 1, eq: B },
    { name: 'Розведення в нахилі', level: 2, eq: GD },
  ],
  biceps: [
    { name: 'Згинання рук з гантелями', level: 1, eq: GD },
    { name: 'Згинання рук на нижньому блоці', level: 1, eq: G },
    { name: 'Згинання рук з гумовою стрічкою', level: 1, eq: B },
    { name: 'Підтягування зворотним хватом', level: 2, eq: B },
  ],
  triceps: [
    { name: 'Розгинання рук на блоці', level: 1, eq: G },
    { name: 'Французький жим з гантеллю', level: 1, eq: GD },
    { name: 'Зворотні відтискання від лавки', level: 1, eq: B },
    { name: 'Вузькі відтискання', level: 2, eq: B },
  ],
};

const WARMUP = {
  ankle:    { joint: 'Гомілковостоп', need: 'мобільність', drill: 'Нахили коліна до стіни, 8/сторону' },
  hip:      { joint: 'Кульшовий', need: 'мобільність', drill: '«Найкраща розтяжка у світі», 5/сторону' },
  knee:     { joint: 'Коліно', need: 'стабільність', drill: 'Присід з міні-бендом над колінами, 10' },
  lumbar:   { joint: 'Поперек', need: 'стабільність', drill: 'Пташка-собака, 6/сторону' },
  thoracic: { joint: 'Грудний відділ', need: 'мобільність', drill: '«Відкрита книга», 8/сторону' },
  scapula:  { joint: 'Лопатка', need: 'стабільність', drill: 'Відтискання лопатками, 10' },
  shoulder: { joint: 'Плече', need: 'мобільність', drill: 'Проведення палиці через голову, 10' },
};
type JointKey = keyof typeof WARMUP;

type Focus = 'full' | 'upper' | 'lower';
interface Slot { pattern: Pattern; role: Role }
interface DayTemplate { key: string; title: string; focus: Focus; slots: Slot[]; variant: number }

const s = (pattern: Pattern, role: Role): Slot => ({ pattern, role });

const T: Record<string, DayTemplate> = {
  fbA: { key: 'fbA', title: 'Фулбоді A', focus: 'full', variant: 0, slots: [s('squat','main'), s('hpush','main'), s('hpull','main'), s('hinge','secondary'), s('delts','accessory'), s('core','core')] },
  fbB: { key: 'fbB', title: 'Фулбоді B', focus: 'full', variant: 1, slots: [s('hinge','main'), s('vpush','main'), s('vpull','main'), s('lunge','secondary'), s('biceps','accessory'), s('core','core')] },
  fbC: { key: 'fbC', title: 'Фулбоді C', focus: 'full', variant: 2, slots: [s('lunge','main'), s('hpush','main'), s('vpull','main'), s('hinge','secondary'), s('triceps','accessory'), s('core','core')] },
  upA: { key: 'upA', title: 'Верх A', focus: 'upper', variant: 0, slots: [s('hpush','main'), s('hpull','main'), s('vpush','secondary'), s('vpull','secondary'), s('delts','accessory'), s('triceps','accessory')] },
  loA: { key: 'loA', title: 'Низ A', focus: 'lower', variant: 0, slots: [s('squat','main'), s('hinge','secondary'), s('lunge','secondary'), s('core','core')] },
  upB: { key: 'upB', title: 'Верх B', focus: 'upper', variant: 1, slots: [s('vpush','main'), s('vpull','main'), s('hpush','secondary'), s('hpull','secondary'), s('biceps','accessory'), s('delts','accessory')] },
  loB: { key: 'loB', title: 'Низ B', focus: 'lower', variant: 1, slots: [s('hinge','main'), s('squat','secondary'), s('lunge','secondary'), s('core','core')] },
  push: { key: 'push', title: 'Жим', focus: 'upper', variant: 0, slots: [s('hpush','main'), s('vpush','secondary'), s('hpush','secondary'), s('delts','accessory'), s('triceps','accessory')] },
  pull: { key: 'pull', title: 'Тяга', focus: 'upper', variant: 0, slots: [s('vpull','main'), s('hpull','secondary'), s('hpull','secondary'), s('delts','accessory'), s('biceps','accessory')] },
  legs: { key: 'legs', title: 'Ноги', focus: 'lower', variant: 0, slots: [s('squat','main'), s('hinge','secondary'), s('lunge','secondary'), s('core','core')] },
  chest: { key: 'chest', title: 'Груди + трицепс', focus: 'upper', variant: 0, slots: [s('hpush','main'), s('hpush','secondary'), s('hpush','secondary'), s('triceps','accessory'), s('triceps','accessory')] },
  back: { key: 'back', title: 'Спина + біцепс', focus: 'upper', variant: 0, slots: [s('vpull','main'), s('hpull','secondary'), s('vpull','secondary'), s('hpull','secondary'), s('biceps','accessory'), s('biceps','accessory')] },
  shoulders: { key: 'shoulders', title: 'Плечі + кор', focus: 'upper', variant: 0, slots: [s('vpush','main'), s('delts','accessory'), s('delts','accessory'), s('core','core'), s('core','core')] },
};

export const SPLITS: Record<Split, { label: string; desc: string; days: number[] }> = {
  fullbody:   { label: 'Фулбоді', desc: 'Усі базові патерни щотренування. Висока частота, найкраще для старту.', days: [2, 3, 4] },
  upperlower: { label: 'Верх / Низ', desc: 'Чергування верху і низу тіла. Кожна група 2 рази на тиждень.', days: [2, 3, 4, 6] },
  ppl:        { label: 'Жим / Тяга / Ноги', desc: 'Push-Pull-Legs. Більше обсягу на групу, потрібно 3, 5 або 6 днів.', days: [3, 5, 6] },
  bro:        { label: 'Спліт по групах', desc: 'Одна-дві групи м\'язів на день. Частота 1×/тиждень — для досвідчених.', days: [4, 5] },
};

const SCHEDULE: Record<Split, Record<number, string[]>> = {
  fullbody:   { 2: ['fbA','fbB'], 3: ['fbA','fbB','fbC'], 4: ['fbA','fbB','fbC','fbA'] },
  upperlower: { 2: ['upA','loA'], 3: ['upA','loA','fbB'], 4: ['upA','loA','upB','loB'], 6: ['upA','loA','upB','loB','upA','loA'] },
  ppl:        { 3: ['push','pull','legs'], 5: ['push','pull','legs','upA','loB'], 6: ['push','pull','legs','push','pull','legs'] },
  bro:        { 4: ['chest','back','legs','shoulders'], 5: ['chest','back','legs','shoulders','fbA'] },
};

export const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];
const DAY_SLOTS: Record<number, number[]> = {
  2: [0, 3], 3: [0, 2, 4], 4: [0, 1, 3, 4], 5: [0, 1, 2, 4, 5], 6: [0, 1, 2, 3, 4, 5],
};

export function recommendedSplit(level: Level, days: number): Split {
  if (level === 1 && days <= 3) return 'fullbody';
  if (days === 4) return level === 1 ? 'fullbody' : 'upperlower';
  if (days >= 5) return 'ppl';
  return 'fullbody';
}

export function splitAvailable(split: Split, days: number) {
  return SPLITS[split].days.includes(days);
}

export function weekPlan(split: Split, days: number): { weekday: number; title: string; focus: Focus }[] {
  const keys = SCHEDULE[split][days] ?? SCHEDULE[recommendedSplit(2, days)][days];
  return keys.map((k, i) => ({ weekday: DAY_SLOTS[days][i], title: T[k].title, focus: T[k].focus }));
}

interface Params { sets: number; reps: string; rest: string; rir: string }

export const GOALS: Record<Goal, { label: string; desc: string; main: Params; secondary: Params; accessory: Params }> = {
  fatloss: {
    label: 'Схуднення', desc: 'Зберегти м\'язи в дефіциті калорій, підняти витрату енергії.',
    main: { sets: 3, reps: '8–12', rest: '60–90 с', rir: '2' },
    secondary: { sets: 3, reps: '10–15', rest: '45–60 с', rir: '2' },
    accessory: { sets: 2, reps: '12–15', rest: '30–45 с', rir: '1–2' },
  },
  hypertrophy: {
    label: 'Гіпертрофія', desc: 'Набір м\'язової маси: помірна вага, достатній обсяг.',
    main: { sets: 4, reps: '6–10', rest: '2 хв', rir: '1–2' },
    secondary: { sets: 3, reps: '8–12', rest: '90 с', rir: '1–2' },
    accessory: { sets: 3, reps: '12–15', rest: '60 с', rir: '0–1' },
  },
  strength: {
    label: 'Сила', desc: 'Максимальна сила в базових рухах: важко, мало повторень.',
    main: { sets: 5, reps: '3–5', rest: '3 хв', rir: '1–2' },
    secondary: { sets: 3, reps: '5–8', rest: '2 хв', rir: '2' },
    accessory: { sets: 2, reps: '8–12', rest: '90 с', rir: '2' },
  },
  general: {
    label: 'Загальна форма', desc: 'Здоров\'я, рухливість, витривалість і сила в балансі.',
    main: { sets: 3, reps: '8–12', rest: '90 с', rir: '2–3' },
    secondary: { sets: 3, reps: '10–12', rest: '60–90 с', rir: '2–3' },
    accessory: { sets: 2, reps: '12–15', rest: '60 с', rir: '2' },
  },
};

export const LEVELS: Record<Level, { label: string; desc: string }> = {
  1: { label: 'Початківець', desc: 'До 6 місяців регулярних тренувань. Фокус на техніці.' },
  2: { label: 'Середній', desc: '6 місяців – 2 роки. Впевнена техніка базових рухів.' },
  3: { label: 'Просунутий', desc: 'Понад 2 роки. Прогрес уже повільний, потрібна варіативність.' },
};

export const EQUIPMENT: Record<Equipment, { label: string; desc: string }> = {
  gym:        { label: 'Тренажерний зал', desc: 'Штанга, гантелі, блоки, тренажери.' },
  dumbbells:  { label: 'Гантелі вдома', desc: 'Пара гантелей, лавка або стілець, турнік.' },
  bodyweight: { label: 'Власна вага', desc: 'Турнік, петлі або стіл для тяг. Без обтяжень.' },
};

export interface ProgramExercise {
  id: string;
  pattern: Pattern;
  role: Role;
  name: string;
  sets: number;
  reps: string;
  rest: string;
  rir: string;
  note?: string;
}

export interface ProgramDay {
  id: string;
  note?: string;
  weekday: number;
  title: string;
  focus: Focus;
  warmup: { joint: string; need: string; drill: string }[];
  exercises: ProgramExercise[];
}

export interface ExerciseInfo { name: string; pattern: Pattern; level: Level; eq: Equipment[]; avoid: Injury[] }

export const EXERCISES: ExerciseInfo[] = (Object.keys(EX) as Pattern[]).flatMap(pattern =>
  EX[pattern].map(e => ({ ...e, pattern, avoid: AVOID[e.name] ?? [] })));

export function riskFor(name: string, injuries: Injury[] = []): Injury[] {
  return (AVOID[name] ?? []).filter(i => injuries.includes(i));
}

export interface DosePreset { id: string; label: string; sets: number; reps: string; rest: string; rir: string }

export const DOSE_PRESETS: DosePreset[] = [
  { id: 'strength',  label: 'Сила',          sets: 5, reps: '3–5',     rest: '3 хв',  rir: '1–2' },
  { id: 'power-hyp', label: 'Сила + маса',   sets: 4, reps: '6–8',     rest: '2 хв',  rir: '1–2' },
  { id: 'hyp',       label: 'Гіпертрофія',   sets: 3, reps: '8–12',    rest: '90 с',  rir: '1–2' },
  { id: 'pump',      label: 'Пампінг',       sets: 3, reps: '12–15',   rest: '60 с',  rir: '0–1' },
  { id: 'endurance', label: 'Витривалість',  sets: 2, reps: '15–20',   rest: '45 с',  rir: '2' },
  { id: 'technique', label: 'Техніка',       sets: 3, reps: '8–10',    rest: '90 с',  rir: '3–4' },
  { id: 'iso',       label: 'Ізометрія',     sets: 3, reps: '30–45 с', rest: '45 с',  rir: '—' },
  { id: 'interval',  label: 'Інтервали',     sets: 1, reps: '10–15 хв', rest: '—',    rir: '—' },
];

let uidCounter = 0;
export function uid(prefix = 'x'): string {
  uidCounter = (uidCounter + 1) % 1e6;
  return `${prefix}${Date.now().toString(36)}${uidCounter.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function newExercise(pattern: Pattern, name: string, role: Role = 'secondary', dose?: DosePreset): ProgramExercise {
  const d = dose ?? DOSE_PRESETS.find(p => p.id === (pattern === 'core' ? 'iso' : pattern === 'loco' ? 'interval' : 'hyp'))!;
  return { id: uid('e'), pattern, role, name, sets: d.sets, reps: d.reps, rest: d.rest, rir: d.rir };
}

function candidates(pattern: Pattern, level: Level, eq: Equipment, injuries: Injury[] = []): Exercise[] {
  const pool = EX[pattern].filter(e => e.eq.includes(eq) && riskFor(e.name, injuries).length === 0);
  const fit = pool.filter(e => e.level <= level && e.level >= level - 1);
  if (fit.length) return [...fit].sort((a, b) => b.level - a.level);
  const easier = pool.filter(e => e.level <= level).sort((a, b) => b.level - a.level);
  return easier.length ? easier : [...pool].sort((a, b) => a.level - b.level);
}

function paramsFor(goal: Goal, level: Level, role: Role): Params {
  const g = GOALS[goal];
  if (role === 'core') return { sets: level === 1 ? 2 : 3, reps: goal === 'strength' ? '20–30 с' : '30–45 с', rest: '45 с', rir: '—' };
  if (role === 'finisher') return { sets: 1, reps: goal === 'fatloss' ? '12–15 хв' : '10 хв', rest: '—', rir: '—' };
  const base = role === 'main' ? g.main : role === 'secondary' ? g.secondary : g.accessory;
  let sets = base.sets;
  if (level === 1) sets = Math.max(2, sets - 1);
  if (level === 3 && role !== 'accessory') sets += 1;
  const rir = level === 1 && base.rir !== '—' ? '2–3' : base.rir;
  const reps = level === 1 && goal === 'strength' && role === 'main' ? '5–6' : base.reps;
  return { ...base, sets, rir, reps };
}

const JOINTS: Record<Focus, JointKey[]> = {
  lower: ['ankle', 'hip', 'knee', 'lumbar'],
  upper: ['thoracic', 'scapula', 'shoulder', 'lumbar'],
  full:  ['ankle', 'hip', 'thoracic', 'scapula', 'lumbar'],
};

export function buildProgram(cfg: ProgramConfig): ProgramDay[] {
  const keys = SCHEDULE[cfg.split][cfg.days] ?? SCHEDULE[recommendedSplit(cfg.level, cfg.days)][cfg.days];
  return keys.map((k, dayIdx) => {
    const tpl = T[k];
    let slots = [...tpl.slots];
    if (cfg.goal === 'strength' || cfg.level === 1) {
      let acc = 0;
      slots = slots.filter(sl => sl.role !== 'accessory' || ++acc <= 1);
    }
    if (cfg.level === 1) slots = slots.slice(0, 5);
    if (cfg.goal === 'fatloss' || cfg.goal === 'general') slots.push({ pattern: 'loco', role: 'finisher' });

    const used = new Set<string>();
    const exercises: ProgramExercise[] = [];
    slots.forEach((sl, i) => {
      const id = `${k}-${i}`;
      let free = candidates(sl.pattern, cfg.level, cfg.equipment, cfg.injuries).filter(e => !used.has(e.name));
      if (!free.length) {
        free = EX[sl.pattern]
          .filter(e => e.eq.includes(cfg.equipment) && !used.has(e.name) && riskFor(e.name, cfg.injuries).length === 0)
          .sort((a, b) => Math.abs(a.level - cfg.level) - Math.abs(b.level - cfg.level));
      }
      if (!free.length) return;
      const pick = free[(tpl.variant + (sl.role === 'main' ? 0 : 1)) % free.length];
      used.add(pick.name);
      exercises.push({ id: `${id}-${dayIdx}`, pattern: sl.pattern, role: sl.role, name: pick.name, ...paramsFor(cfg.goal, cfg.level, sl.role) });
    });

    return {
      id: `d${dayIdx}-${k}`,
      weekday: DAY_SLOTS[cfg.days][dayIdx],
      title: tpl.title,
      focus: tpl.focus,
      warmup: JOINTS[tpl.focus].map(j => WARMUP[j]),
      exercises,
    };
  });
}

export function weeklyVolume(program: ProgramDay[]) {
  const vol: Partial<Record<Pattern, number>> = {};
  program.forEach(d => d.exercises.forEach(e => {
    if (e.role === 'finisher') return;
    vol[e.pattern] = (vol[e.pattern] ?? 0) + e.sets;
  }));
  return vol;
}

export function progression(goal: Goal, level: Level): { week: string; text: string }[] {
  const add = goal === 'strength' ? '+2,5–5 кг в основних' : 'додай 1–2 повторення';
  if (level === 1) return [
    { week: 'Тиждень 1', text: 'Освоєння техніки. Вага, з якою лишається 3 повторення в запасі.' },
    { week: 'Тиждень 2', text: 'Ті самі ваги, повторення до верхньої межі діапазону.' },
    { week: 'Тиждень 3', text: 'Досяг верхньої межі в усіх підходах — додай мінімальну вагу.' },
    { week: 'Тиждень 4', text: 'Продовжуй подвійну прогресію: спершу повторення, потім вага.' },
  ];
  return [
    { week: 'Тиждень 1', text: 'Вхідний: на 1 повторення більше в запасі, ніж вказано (RIR +1).' },
    { week: 'Тиждень 2', text: `Робочий: точно за RIR, ${add}.` },
    { week: 'Тиждень 3', text: level === 3 ? 'Пік: +1 підхід в основних вправах, RIR на нижній межі.' : `Пік: ${add}, RIR на нижній межі.` },
    { week: 'Тиждень 4', text: 'Розвантаження: −40% підходів, ті самі ваги. Потім новий цикл.' },
  ];
}

export function principles(cfg: ProgramConfig): { title: string; text: string }[] {
  const g = GOALS[cfg.goal];
  const list = [
    { title: 'Специфічність', text: `Ціль «${g.label.toLowerCase()}» визначає параметри: основні вправи ${g.main.reps} повт., відпочинок ${g.main.rest}.` },
    { title: 'Базові шаблони рухів', text: 'Кожен тиждень покриває присідання, випад, нахил, жими і тяги в двох площинах та рухи тулуба.' },
    { title: 'Joint-by-Joint', text: 'Розминка чергує мобільність (гомілковостоп, кульшовий, грудний, плече) і стабільність (коліно, поперек, лопатка).' },
    { title: 'Відновлення', text: 'Ті самі м\'язові групи не тренуються два дні поспіль — адаптація відбувається під час відпочинку.' },
    { title: 'Прогресія', text: 'Навантаження зростає поступово за 4-тижневим циклом з розвантаженням.' },
  ];
  if (cfg.level === 1) list.splice(1, 0, { title: 'Піраміда навичок', text: 'Рівень Movement: спершу якість руху, потім вага. Прості варіанти вправ, 2–3 повторення в запасі.' });
  if (cfg.level === 3) list.push({ title: 'Варіативність', text: 'Складніші варіанти вправ і більший обсяг долають ефект плато.' });
  return list;
}
