'use client';
import { useState, useEffect } from 'react';
import {
  GOALS, LEVELS, SPLITS, EQUIPMENT, INJURIES, WEEKDAYS,
  weekPlan, recommendedSplit, splitAvailable,
  type ProgramConfig, type Goal, type Level, type Split, type Equipment, type Injury,
} from '../../data/programBuilder';
import type { ClientInfo } from '../../data/programStore';

const STEPS = ['Клієнт', 'Мета', 'Рівень', 'Дні', 'Спліт', 'Обладнання'];
const DAY_OPTIONS = [2, 3, 4, 5, 6];

function daysWord(n: number) {
  return n >= 5 ? 'днів' : 'дні';
}

export default function ProgramWizard({ onCreate }: { onCreate: (cfg: ProgramConfig, client: ClientInfo) => void }) {
  const [step, setStep] = useState(0);
  const [client, setClient] = useState<ClientInfo>({ name: '', notes: '', injuries: [] });
  const [goal, setGoal] = useState<Goal | null>(null);
  const [level, setLevel] = useState<Level | null>(null);
  const [days, setDays] = useState<number | null>(null);
  const [split, setSplit] = useState<Split | null>(null);
  const [equipment, setEquipment] = useState<Equipment | null>(null);

  useEffect(() => {
    if (days && split && !splitAvailable(split, days)) setSplit(null);
  }, [days, split]);

  const answered = [true, goal, level, days, split, equipment];
  const canNext = answered[step] !== null;
  const rec = level && days ? recommendedSplit(level, days) : null;
  const preview = days ? weekPlan(split ?? rec ?? 'fullbody', days) : [];
  const params = goal ? GOALS[goal].main : null;

  function toggleInjury(i: Injury) {
    setClient(c => ({ ...c, injuries: c.injuries.includes(i) ? c.injuries.filter(x => x !== i) : [...c.injuries, i] }));
  }

  function next() {
    if (!canNext) return;
    if (step === 3 && !split && rec) setSplit(rec);
    if (step < STEPS.length - 1) { setStep(step + 1); return; }
    if (goal && level && days && split && equipment) {
      onCreate({ goal, level, days, split, equipment, injuries: client.injuries }, { ...client, name: client.name.trim() });
    }
  }

  return (
    <div className="pb-wizard">
      <h1 className="pb-title">Нова програма</h1>
      <p className="pb-sub">Шість відповідей — і чернетка програми, яку далі можна повністю відредагувати під клієнта.</p>

      <ol className="pb-rail" aria-label="Кроки">
        {STEPS.map((label, i) => (
          <li key={label}>
            <button
              className={`pb-rail-step${i === step ? ' cur' : ''}${i > 0 && answered[i] !== null ? ' ok' : ''}`}
              onClick={() => setStep(i)}
              disabled={i > step && !answered.slice(0, i).every(a => a !== null)}
            >
              <span className="pb-rail-n">{i + 1}</span>{label}
            </button>
          </li>
        ))}
      </ol>

      <div className="pb-layout">
        <div className="pb-question">
          {step === 0 && (
            <>
              <h2 className="pb-q">Для кого програма?</h2>
              <div className="pw-fields">
                <label className="pw-field">
                  <span>Ім&apos;я клієнта</span>
                  <input value={client.name} onChange={e => setClient({ ...client, name: e.target.value })} placeholder="Наприклад, Олена" autoFocus />
                </label>
                <fieldset className="pw-field">
                  <legend>Обмеження та травми</legend>
                  <div className="pw-chips">
                    {(Object.keys(INJURIES) as Injury[]).map(i => (
                      <button key={i} type="button" className={`pw-chip${client.injuries.includes(i) ? ' on' : ''}`} aria-pressed={client.injuries.includes(i)} onClick={() => toggleInjury(i)}>
                        {INJURIES[i].label}
                      </button>
                    ))}
                  </div>
                  {client.injuries.length > 0 && (
                    <ul className="pw-injury-notes">
                      {client.injuries.map(i => <li key={i}>{INJURIES[i].desc}</li>)}
                    </ul>
                  )}
                </fieldset>
                <label className="pw-field">
                  <span>Нотатки</span>
                  <textarea rows={3} value={client.notes} onChange={e => setClient({ ...client, notes: e.target.value })} placeholder="Вік, досвід, цілі, особливості…" />
                </label>
              </div>
              <p className="pb-hint">Усе на цьому кроці необов&apos;язкове.</p>
            </>
          )}

          {step === 1 && (
            <>
              <h2 className="pb-q">Яка мета?</h2>
              <div className="pb-options">
                {(Object.keys(GOALS) as Goal[]).map(g => (
                  <button key={g} className={`pb-opt${goal === g ? ' sel' : ''}`} onClick={() => setGoal(g)} aria-pressed={goal === g}>
                    <span className="pb-opt-title">{GOALS[g].label}</span>
                    <span className="pb-opt-desc">{GOALS[g].desc}</span>
                    <span className="pb-opt-meta">{GOALS[g].main.reps} повт., відпочинок {GOALS[g].main.rest}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="pb-q">Який рівень підготовки?</h2>
              <div className="pb-options">
                {([1, 2, 3] as Level[]).map(l => (
                  <button key={l} className={`pb-opt${level === l ? ' sel' : ''}`} onClick={() => setLevel(l)} aria-pressed={level === l}>
                    <span className="pb-opt-title">{LEVELS[l].label}</span>
                    <span className="pb-opt-desc">{LEVELS[l].desc}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="pb-q">Скільки днів на тиждень?</h2>
              <div className="pb-days-pick">
                {DAY_OPTIONS.map(n => (
                  <button key={n} className={`pb-daynum${days === n ? ' sel' : ''}`} onClick={() => setDays(n)} aria-pressed={days === n}>
                    {n}
                  </button>
                ))}
              </div>
              {days && <p className="pb-hint">{days <= 3 ? 'Між тренуваннями щонайменше день відпочинку.' : days === 4 ? 'Два блоки по два дні з відпочинком посередині.' : 'Висока частота — сон і харчування стають критичними для відновлення.'}</p>}
            </>
          )}

          {step === 4 && days && (
            <>
              <h2 className="pb-q">Як розподілити навантаження?</h2>
              <div className="pb-options">
                {(Object.keys(SPLITS) as Split[]).map(sp => {
                  const ok = splitAvailable(sp, days);
                  return (
                    <button key={sp} className={`pb-opt${split === sp ? ' sel' : ''}`} onClick={() => ok && setSplit(sp)} disabled={!ok} aria-pressed={split === sp}>
                      <span className="pb-opt-title">
                        {SPLITS[sp].label}
                        {rec === sp && <span className="pb-rec">рекомендовано</span>}
                      </span>
                      <span className="pb-opt-desc">{ok ? SPLITS[sp].desc : `Не підходить для ${days} ${daysWord(days)}: можливо на ${SPLITS[sp].days.join(', ')}.`}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {step === 5 && (
            <>
              <h2 className="pb-q">Де тренується клієнт?</h2>
              <div className="pb-options">
                {(Object.keys(EQUIPMENT) as Equipment[]).map(eq => (
                  <button key={eq} className={`pb-opt${equipment === eq ? ' sel' : ''}`} onClick={() => setEquipment(eq)} aria-pressed={equipment === eq}>
                    <span className="pb-opt-title">{EQUIPMENT[eq].label}</span>
                    <span className="pb-opt-desc">{EQUIPMENT[eq].desc}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          <div className="pb-nav">
            {step > 0 && <button className="btn-secondary" onClick={() => setStep(step - 1)}>Назад</button>}
            <button className="btn-primary" onClick={next} disabled={!canNext}>
              {step === STEPS.length - 1 ? 'Скласти програму' : step === 0 && !client.name && !client.injuries.length ? 'Пропустити' : 'Далі'}
            </button>
          </div>
        </div>

        <aside className="pb-preview" aria-label="Попередній перегляд">
          <h3 className="pb-panel-title">{client.name ? `Тиждень: ${client.name}` : 'Тиждень клієнта'}</h3>
          {days ? (
            <div className="pb-strip live">
              {WEEKDAYS.map((wd, i) => {
                const d = preview.find(x => x.weekday === i);
                return (
                  <div key={wd} className={`pb-strip-day${d ? ' on' : ''}`}>
                    <span className="pb-strip-wd">{wd}</span>
                    <span className="pb-strip-title">{d ? d.title : 'Відпочинок'}</span>
                  </div>
                );
              })}
            </div>
          ) : <p className="pb-preview-empty">Обери кількість днів, щоб побачити розклад.</p>}
          <dl className="pb-preview-params">
            <div><dt>Мета</dt><dd>{goal ? GOALS[goal].label : '—'}</dd></div>
            <div><dt>Основні вправи</dt><dd>{params ? `${params.sets}×${params.reps}` : '—'}</dd></div>
            <div><dt>Відпочинок</dt><dd>{params ? params.rest : '—'}</dd></div>
            <div><dt>Рівень</dt><dd>{level ? LEVELS[level].label : '—'}</dd></div>
            <div><dt>Спліт</dt><dd>{split ? SPLITS[split].label : rec ? `${SPLITS[rec].label} (рек.)` : '—'}</dd></div>
            <div><dt>Обмеження</dt><dd>{client.injuries.length ? client.injuries.map(i => INJURIES[i].label).join(', ') : '—'}</dd></div>
          </dl>
        </aside>
      </div>
    </div>
  );
}
