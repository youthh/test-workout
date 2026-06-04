'use client';
import { useState, useEffect, useCallback } from 'react';
import { TOPICS } from '../data/topics';
import type { Question } from '../types';
import { sm2, cardKey, loadSRSCards, saveSRSCards, newCard, todayStr, type SRSCard, type SRSRating } from '../data/srs';

interface DueCard {
  card: SRSCard;
  question: Question;
  topicTitle: string;
  topicId: string;
}

interface SRSScreenProps {
  onBack: () => void;
}

const CATS = [
  { key: 'anatomy',  label: 'Анатомія',    color: '#ff7b00', ids: ['osteology','myology','muscle-functions'] },
  { key: 'bio',      label: 'Біомеханіка', color: '#4a9eff', ids: ['planes','spine','arms','legs','chest','shoulders','back','core'] },
  { key: 'method',   label: 'Методика',    color: '#3ecf8e', ids: ['movement-patterns','pyramid','training-programming'] },
  { key: 'other',    label: 'Інше',        color: '#a78bfa', ids: ['psych','nutrition'] },
];

function getCatColor(topicId: string): string {
  return CATS.find(c => c.ids.includes(topicId))?.color ?? '#ff7b00';
}

function buildDueQueue(selectedIds: string[]): DueCard[] {
  const cards = loadSRSCards();
  const today = todayStr();
  const due: DueCard[] = [];

  TOPICS.filter(t => selectedIds.includes(t.id)).forEach(topic => {
    topic.questions.forEach((q, qIdx) => {
      const key = cardKey(topic.id, qIdx);
      const card = cards[key] ?? newCard(topic.id, qIdx);
      if (card.nextReview <= today) {
        due.push({ card, question: q, topicTitle: topic.title, topicId: topic.id });
      }
    });
  });

  due.sort((a, b) => a.card.nextReview.localeCompare(b.card.nextReview));
  return due;
}

function getDueCounts(): Record<string, number> {
  const cards = loadSRSCards();
  const today = todayStr();
  const counts: Record<string, number> = {};
  TOPICS.forEach(topic => {
    let count = 0;
    topic.questions.forEach((_, qIdx) => {
      const key = cardKey(topic.id, qIdx);
      const card = cards[key] ?? newCard(topic.id, qIdx);
      if (card.nextReview <= today) count++;
    });
    counts[topic.id] = count;
  });
  return counts;
}

/* ── SELECT SCREEN ── */
function SelectScreen({ onStart, onBack }: { onStart: (ids: string[]) => void; onBack: () => void }) {
  const [selected, setSelected] = useState<Set<string>>(new Set(TOPICS.map(t => t.id)));
  const dueCounts = getDueCounts();

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleCat = (ids: string[]) => {
    const allOn = ids.every(id => selected.has(id));
    setSelected(prev => {
      const next = new Set(prev);
      ids.forEach(id => allOn ? next.delete(id) : next.add(id));
      return next;
    });
  };

  const totalDue = TOPICS.filter(t => selected.has(t.id)).reduce((s, t) => s + dueCounts[t.id], 0);
  const totalCards = TOPICS.reduce((s, t) => s + t.questions.length, 0);
  const reviewed = Object.keys(loadSRSCards()).length;

  return (
    <div className="quiz-screen active">
      <div className="container">
        <div className="quiz-header">
          <button className="back-btn" onClick={onBack}>← Назад</button>
          <div className="quiz-title">🧠 SRS Повторення</div>
          <div />
        </div>

        <div className="srs-select-info">
          <div className="srs-info-stat">
            <div className="srs-info-val" style={{ color: 'var(--accent)' }}>{totalDue}</div>
            <div className="srs-info-lbl">До повторення</div>
          </div>
          <div className="srs-info-stat">
            <div className="srs-info-val">{reviewed}</div>
            <div className="srs-info-lbl">Вивчено карток</div>
          </div>
          <div className="srs-info-stat">
            <div className="srs-info-val" style={{ color: 'var(--text-mute)' }}>{totalCards}</div>
            <div className="srs-info-lbl">Всього карток</div>
          </div>
        </div>

        <div className="srs-select-hint">Обери теми для сесії повторення:</div>

        {CATS.map(cat => {
          const catTopics = TOPICS.filter(t => cat.ids.includes(t.id));
          const allOn = catTopics.every(t => selected.has(t.id));
          const catDue = catTopics.reduce((s, t) => s + dueCounts[t.id], 0);
          return (
            <div key={cat.key} className="srs-cat-block">
              <div className="srs-cat-header">
                <div className="srs-cat-dot" style={{ background: cat.color }} />
                <div className="srs-cat-name" style={{ color: cat.color }}>{cat.label}</div>
                <div className="srs-cat-line" />
                {catDue > 0 && <div className="srs-cat-due" style={{ color: cat.color }}>{catDue} карток</div>}
                <button
                  className={`srs-cat-toggle${allOn ? ' on' : ''}`}
                  style={{ '--c': cat.color } as React.CSSProperties}
                  onClick={() => toggleCat(catTopics.map(t => t.id))}
                >
                  {allOn ? 'Зняти всі' : 'Вибрати всі'}
                </button>
              </div>
              <div className="srs-topics-grid">
                {catTopics.map(t => {
                  const due = dueCounts[t.id];
                  const on = selected.has(t.id);
                  return (
                    <button
                      key={t.id}
                      className={`srs-topic-card${on ? ' on' : ''}`}
                      style={{ '--c': cat.color } as React.CSSProperties}
                      onClick={() => toggle(t.id)}
                    >
                      <div className="srs-tc-head">
                        <span
                          className="srs-tc-icon"
                          dangerouslySetInnerHTML={{ __html: t.icon }}
                        />
                        <div className={`srs-tc-check${on ? ' on' : ''}`}>
                          {on ? '✓' : ''}
                        </div>
                      </div>
                      <div className="srs-tc-name">{t.title}</div>
                      <div className="srs-tc-count">
                        {due > 0
                          ? <span style={{ color: cat.color }}>{due} до повторення</span>
                          : <span style={{ color: 'var(--text-mute)' }}>0 сьогодні</span>}
                      </div>
                      <div className="srs-tc-total">{t.questions.length} карток</div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div className="srs-start-wrap">
          <button
            className="srs-start-btn"
            disabled={selected.size === 0 || totalDue === 0}
            onClick={() => onStart([...selected])}
          >
            {totalDue === 0
              ? 'Немає карток для повторення'
              : `Почати — ${totalDue} карток →`}
          </button>
          {totalDue === 0 && selected.size > 0 && (
            <div className="srs-no-due">Всі картки обраних тем вже повторені сьогодні 🎉</div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── STUDY SCREEN ── */
export default function SRSScreen({ onBack }: SRSScreenProps) {
  const [phase, setPhase] = useState<'select' | 'study'>('select');
  const [queue, setQueue] = useState<DueCard[]>([]);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [doneToday, setDoneToday] = useState(0);
  const [finished, setFinished] = useState(false);

  const startSession = useCallback((ids: string[]) => {
    const q = buildDueQueue(ids);
    setQueue(q);
    setIdx(0);
    setDoneToday(0);
    setFinished(q.length === 0);
    setPhase('study');
  }, []);

  const handleRate = useCallback((rating: SRSRating) => {
    if (idx >= queue.length) return;
    const { card } = queue[idx];
    const updated = sm2(card, rating);
    const cards = loadSRSCards();
    cards[cardKey(card.topicId, card.qIdx)] = updated;
    saveSRSCards(cards);

    setDoneToday(d => d + 1);
    setRevealed(false);

    if (idx + 1 >= queue.length) setFinished(true);
    else setIdx(i => i + 1);
  }, [idx, queue]);

  if (phase === 'select') {
    return <SelectScreen onStart={startSession} onBack={onBack} />;
  }

  if (finished) {
    return (
      <div className="quiz-screen active">
        <div className="container">
          <div className="quiz-header">
            <button className="back-btn" onClick={onBack}>← Назад</button>
            <div className="quiz-title">SRS Повторення</div>
            <div />
          </div>
          <div className="result-card" style={{ textAlign: 'center', marginTop: 32 }}>
            <div className="result-emoji">🧠</div>
            <div className="result-title">Сесію завершено!</div>
            <div className="result-subtitle">Ти повторив {doneToday} карток.</div>
            <div className="actions" style={{ justifyContent: 'center', marginTop: 24 }}>
              <button className="btn-secondary" onClick={() => setPhase('select')}>Ще раз вибрати теми</button>
              <button className="btn-secondary" onClick={onBack}>← До тем</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const current = queue[idx];
  if (!current) return null;
  const { question, topicTitle, topicId } = current;
  const correctAnswer = question.a[question.c];
  const pct = queue.length > 0 ? Math.round(doneToday / queue.length * 100) : 0;
  const catColor = getCatColor(topicId);

  return (
    <div className="quiz-screen active">
      <div className="container">
        <div className="quiz-header">
          <button className="back-btn" onClick={() => setPhase('select')}>← Теми</button>
          <div className="quiz-title">🧠 SRS Повторення</div>
          <div className="quiz-counter">
            <b style={{ color: 'var(--accent)' }}>{doneToday}</b>/{queue.length}
          </div>
        </div>

        <div className="progress" style={{ marginBottom: 8 }}>
          <div className="progress-bar" style={{ width: pct + '%' }} />
        </div>

        <div style={{
          fontSize: 11, color: catColor, letterSpacing: 1.5,
          textTransform: 'uppercase', marginBottom: 20, textAlign: 'center', fontWeight: 700
        }}>
          {topicTitle}
        </div>

        <div className="question-card">
          <div className="question" style={{ marginBottom: revealed ? 20 : 0 }}>
            {question.q}
          </div>

          {!revealed ? (
            <button
              className="next-btn show"
              onClick={() => setRevealed(true)}
              style={{ background: 'linear-gradient(180deg,#2a2a2a,#1a1a1a)', boxShadow: 'none', border: '1px solid var(--border)' }}
            >
              👁 Показати відповідь
            </button>
          ) : (
            <>
              <div style={{
                background: 'rgba(46,204,113,0.08)', border: '1px solid rgba(46,204,113,0.3)',
                borderRadius: 10, padding: '14px 16px', marginBottom: 14
              }}>
                <div style={{ fontSize: 11, color: 'var(--good)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }}>
                  ✓ Правильна відповідь
                </div>
                <div style={{ color: 'var(--text)', fontSize: 15, fontWeight: 600 }}>{correctAnswer}</div>
              </div>

              {question.e && (
                <div className="explanation show" style={{ marginTop: 0, marginBottom: 20 }}>
                  {question.e}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button onClick={() => handleRate(1)} className="srs-rate-btn srs-rate-bad">😔 Не знав</button>
                <button onClick={() => handleRate(3)} className="srs-rate-btn srs-rate-mid">😕 Важко</button>
                <button onClick={() => handleRate(5)} className="srs-rate-btn srs-rate-good">😊 Знав!</button>
              </div>

              <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text-mute)', textAlign: 'center', letterSpacing: 0.5 }}>
                «Не знав» — повернеться завтра · «Знав!» — через {Math.round(current.card.interval * 2.5) || 6} днів
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
