'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  EXERCISES, PATTERNS, INJURIES, EQUIPMENT, riskFor,
  type Pattern, type Equipment, type Injury, type Level,
} from '../../data/programBuilder';

const LEVEL_LABEL: Record<Level, string> = { 1: 'Початківець', 2: 'Середній', 3: 'Просунутий' };
const PATTERN_KEYS = Object.keys(PATTERNS) as Pattern[];
const EQ_KEYS = Object.keys(EQUIPMENT) as Equipment[];

interface Props {
  open: boolean;
  mode: 'add' | 'replace';
  pattern?: Pattern;
  equipment: Equipment;
  injuries: Injury[];
  onPick: (name: string, pattern: Pattern) => void;
  onClose: () => void;
}

export default function ExercisePicker({ open, mode, pattern, equipment, injuries, onPick, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [pat, setPat] = useState<Pattern | 'all'>('all');
  const [eq, setEq] = useState<Equipment | 'all'>(equipment);
  const [customName, setCustomName] = useState('');
  const [customPattern, setCustomPattern] = useState<Pattern>(pattern ?? 'squat');
  const searchRef = useRef<HTMLInputElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setPat(mode === 'replace' && pattern ? pattern : 'all');
    setEq(equipment);
    setCustomName('');
    setCustomPattern(pattern ?? 'squat');
    const t = setTimeout(() => searchRef.current?.focus(), 0);
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCloseRef.current(); };
    window.addEventListener('keydown', onKey);
    return () => { clearTimeout(t); window.removeEventListener('keydown', onKey); };
  }, [open, mode, pattern, equipment]);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = EXERCISES.filter(e =>
      (pat === 'all' || e.pattern === pat) &&
      (eq === 'all' || e.eq.includes(eq)) &&
      (!q || e.name.toLowerCase().includes(q)));
    return PATTERN_KEYS
      .map(p => {
        const items = list.filter(e => e.pattern === p).map(e => ({ ...e, risk: riskFor(e.name, injuries) }));
        items.sort((a, b) => (a.risk.length ? 1 : 0) - (b.risk.length ? 1 : 0) || a.level - b.level);
        return { pattern: p, items };
      })
      .filter(g => g.items.length);
  }, [query, pat, eq, injuries]);

  if (!open) return null;

  function addCustom() {
    const name = customName.trim();
    if (name) onPick(name, customPattern);
  }

  return (
    <div className="pk-backdrop" onClick={onClose}>
      <div
        className="pk-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pk-title"
        onClick={e => e.stopPropagation()}
      >
        <div className="pk-head">
          <h2 id="pk-title" className="pk-title">{mode === 'replace' ? 'Замінити вправу' : 'Додати вправу'}</h2>
          <button type="button" className="pk-close" onClick={onClose} aria-label="Закрити">✕</button>
        </div>

        <input
          ref={searchRef}
          className="pk-search"
          type="search"
          placeholder="Пошук вправи…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          aria-label="Пошук вправи"
        />

        <div className="pk-chips" role="group" aria-label="Шаблон руху">
          <button type="button" className={`pk-chip${pat === 'all' ? ' on' : ''}`} aria-pressed={pat === 'all'} onClick={() => setPat('all')}>Усі</button>
          {PATTERN_KEYS.map(p => (
            <button
              key={p}
              type="button"
              className={`pk-chip${pat === p ? ' on' : ''}`}
              aria-pressed={pat === p}
              style={{ '--pat': PATTERNS[p].color } as React.CSSProperties}
              onClick={() => { setPat(p); setCustomPattern(p); }}
            >
              {PATTERNS[p].label}
            </button>
          ))}
        </div>

        <div className="pk-chips" role="group" aria-label="Обладнання">
          {EQ_KEYS.map(k => (
            <button key={k} type="button" className={`pk-chip${eq === k ? ' on' : ''}`} aria-pressed={eq === k} onClick={() => setEq(k)}>
              {EQUIPMENT[k].label}
            </button>
          ))}
          <button type="button" className={`pk-chip${eq === 'all' ? ' on' : ''}`} aria-pressed={eq === 'all'} onClick={() => setEq('all')}>Усе обладнання</button>
        </div>

        <div className="pk-list">
          {groups.length === 0 && <p className="pk-empty">Нічого не знайдено. Зміни фільтри або додай свою вправу нижче.</p>}
          {groups.map(g => (
            <section key={g.pattern} className="pk-group">
              <h3 className="pk-group-title" style={{ color: PATTERNS[g.pattern].color }}>{PATTERNS[g.pattern].label}</h3>
              <ul>
                {g.items.map(e => (
                  <li key={e.name}>
                    <button type="button" className={`pk-item${e.risk.length ? ' risky' : ''}`} onClick={() => onPick(e.name, e.pattern)}>
                      <span className="pk-item-name">{e.name}</span>
                      <span className="pk-item-meta">
                        <span className="pk-level">{LEVEL_LABEL[e.level]}</span>
                        {e.risk.length > 0 && (
                          <span className="pe-risk">⚠ {e.risk.map(r => INJURIES[r].label).join(', ')}</span>
                        )}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <form className="pk-custom" onSubmit={e => { e.preventDefault(); addCustom(); }}>
          <label className="pk-custom-label" htmlFor="pk-custom-name">Своя вправа</label>
          <div className="pk-custom-row">
            <input
              id="pk-custom-name"
              className="pe-input"
              placeholder="Назва вправи"
              value={customName}
              onChange={e => setCustomName(e.target.value)}
            />
            <select className="pe-input" value={customPattern} onChange={e => setCustomPattern(e.target.value as Pattern)} aria-label="Шаблон руху своєї вправи">
              {PATTERN_KEYS.map(p => <option key={p} value={p}>{PATTERNS[p].label}</option>)}
            </select>
            <button type="submit" className="btn-primary pk-custom-btn" disabled={!customName.trim()}>Додати</button>
          </div>
        </form>
      </div>
    </div>
  );
}
