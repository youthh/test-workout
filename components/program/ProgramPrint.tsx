'use client';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { GOALS, LEVELS, SPLITS, EQUIPMENT, INJURIES, WEEKDAYS, progression } from '../../data/programBuilder';
import type { SavedProgram } from '../../data/programStore';

const WEEKS = [1, 2, 3, 4];

function formatDate(ts: number) {
  const d = new Date(ts);
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
}

export default function ProgramPrint({ program }: { program: SavedProgram }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const { cfg, client } = program;
  const days = [...program.days].sort((a, b) => a.weekday - b.weekday);
  const injuries = client.injuries.map(i => INJURIES[i].label).join(', ');

  return createPortal(
    <div className="pp-root" aria-hidden="true">
      <header className="pp-head">
        <h1 className="pp-title">{program.title}</h1>
        <dl className="pp-meta">
          {client.name && <div><dt>Клієнт</dt><dd>{client.name}</dd></div>}
          {program.coach && <div><dt>Тренер</dt><dd>{program.coach}</dd></div>}
          <div><dt>Мета</dt><dd>{GOALS[cfg.goal].label}</dd></div>
          <div><dt>Рівень</dt><dd>{LEVELS[cfg.level].label}</dd></div>
          <div><dt>Спліт</dt><dd>{SPLITS[cfg.split].label}, {days.length} дн./тиж.</dd></div>
          <div><dt>Обладнання</dt><dd>{EQUIPMENT[cfg.equipment].label}</dd></div>
          {injuries && <div><dt>Обмеження</dt><dd>{injuries}</dd></div>}
          <div><dt>Дата</dt><dd>{formatDate(program.updatedAt)}</dd></div>
        </dl>
        {program.coachNotes && <p className="pp-notes">{program.coachNotes}</p>}
      </header>

      {days.map(d => (
        <section key={d.id} className="pp-day">
          <h2 className="pp-day-title">{WEEKDAYS[d.weekday]} — {d.title}</h2>
          {d.note && <p className="pp-day-note">{d.note}</p>}
          {d.warmup.length > 0 && (
            <p className="pp-warmup"><b>Розминка:</b> {d.warmup.map(w => w.drill).join('; ')}</p>
          )}
          <table className="pp-table">
            <thead>
              <tr>
                <th className="pp-c-n">№</th>
                <th className="pp-c-name">Вправа</th>
                <th>Підходи × повт.</th>
                <th>Відпочинок</th>
                <th>RIR</th>
                {WEEKS.map(w => <th key={w} className="pp-c-week">Тиж. {w}</th>)}
              </tr>
            </thead>
            <tbody>
              {d.exercises.map((e, i) => (
                <tr key={e.id}>
                  <td className="pp-c-n">{i + 1}</td>
                  <td className="pp-c-name">
                    {e.name}
                    {e.note && <span className="pp-ex-note">{e.note}</span>}
                  </td>
                  <td>{e.role === 'finisher' ? e.reps : `${e.sets} × ${e.reps}`}</td>
                  <td>{e.rest}</td>
                  <td>{e.rir}</td>
                  {WEEKS.map(w => <td key={w} className="pp-c-week" />)}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}

      <footer className="pp-foot">
        <h2 className="pp-foot-title">Прогресія на 4 тижні</h2>
        <ol className="pp-prog">
          {progression(cfg.goal, cfg.level).map(p => (
            <li key={p.week}><b>{p.week}.</b> {p.text}</li>
          ))}
        </ol>
        <p className="pp-legend">RIR — повторення в запасі: скільки ще повторень ти міг би зробити з правильною технікою. У колонках «Тиж.» записуй робочу вагу.</p>
      </footer>
    </div>,
    document.body,
  );
}
