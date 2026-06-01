'use client';
import { useState, useEffect, useCallback } from 'react';
import { TOPICS } from '../data/topics';
import type { Question } from '../types';
import { sm2, cardKey, loadSRSCards, saveSRSCards, newCard, todayStr, type SRSCard, type SRSRating } from '../data/srs';

interface DueCard {
  card: SRSCard;
  question: Question;
  topicTitle: string;
}

interface SRSScreenProps {
  onBack: () => void;
}

function buildDueQueue(): DueCard[] {
  const cards = loadSRSCards();
  const today = todayStr();
  const due: DueCard[] = [];

  TOPICS.forEach(topic => {
    topic.questions.forEach((q, qIdx) => {
      const key = cardKey(topic.id, qIdx);
      const card = cards[key] ?? newCard(topic.id, qIdx);
      if (card.nextReview <= today) {
        due.push({ card, question: q, topicTitle: topic.title });
      }
    });
  });

  // новые карточки в конец, due — вперед
  due.sort((a, b) => a.card.nextReview.localeCompare(b.card.nextReview));
  return due;
}

export default function SRSScreen({ onBack }: SRSScreenProps) {
  const [queue, setQueue] = useState<DueCard[]>([]);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [totalToday, setTotalToday] = useState(0);
  const [doneToday, setDoneToday] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const q = buildDueQueue();
    setQueue(q);
    setTotalToday(q.length);
    setFinished(q.length === 0);
  }, []);

  const handleRate = useCallback((rating: SRSRating) => {
    if (idx >= queue.length) return;
    const { card } = queue[idx];
    const updated = sm2(card, rating);
    const cards = loadSRSCards();
    cards[cardKey(card.topicId, card.qIdx)] = updated;
    saveSRSCards(cards);

    const newDone = doneToday + 1;
    setDoneToday(newDone);
    setRevealed(false);

    if (idx + 1 >= queue.length) {
      setFinished(true);
    } else {
      setIdx(idx + 1);
    }
  }, [idx, queue, doneToday]);

  if (finished) {
    const total = TOPICS.reduce((s, t) => s + t.questions.length, 0);
    const cards = loadSRSCards();
    const reviewed = Object.keys(cards).length;
    return (
      <div className="quiz-screen active">
        <div className="container">
          <div className="quiz-header">
            <button className="back-btn" onClick={onBack}>← Назад</button>
            <div className="quiz-title">Інтервальні повторення</div>
            <div />
          </div>
          <div className="result-card" style={{ textAlign: 'center', marginTop: 32 }}>
            <div className="result-emoji">🧠</div>
            <div className="result-title">На сьогодні все!</div>
            <div className="result-subtitle">
              {doneToday > 0
                ? `Ти повторив ${doneToday} карток сьогодні.`
                : 'Немає карток для повторення на сьогодні.'}
            </div>
            <div style={{ margin: '20px 0', color: 'var(--text-dim)', fontSize: 13, letterSpacing: 1 }}>
              Вивчено карток: <b style={{ color: 'var(--accent)' }}>{reviewed}</b> / {total}
            </div>
            <div className="actions" style={{ justifyContent: 'center' }}>
              <button className="btn-secondary" onClick={onBack}>← До тем</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const current = queue[idx];
  if (!current) return null;
  const { question, topicTitle } = current;
  const correctAnswer = question.a[question.c];
  const pct = totalToday > 0 ? Math.round(doneToday / totalToday * 100) : 0;

  return (
    <div className="quiz-screen active">
      <div className="container">
        <div className="quiz-header">
          <button className="back-btn" onClick={onBack}>← Назад</button>
          <div className="quiz-title">🧠 SRS Повторення</div>
          <div className="quiz-counter">
            <b style={{ color: 'var(--accent)' }}>{doneToday}</b>/{totalToday}
          </div>
        </div>

        <div className="progress" style={{ marginBottom: 8 }}>
          <div className="progress-bar" style={{ width: pct + '%' }} />
        </div>

        <div style={{
          fontSize: 11, color: 'var(--text-mute)', letterSpacing: 1.5,
          textTransform: 'uppercase', marginBottom: 20, textAlign: 'center'
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
                <button
                  onClick={() => handleRate(1)}
                  style={{
                    flex: 1, padding: '12px 8px', borderRadius: 10, border: '1px solid var(--bad)',
                    background: 'rgba(230,57,70,0.1)', color: 'var(--bad)',
                    fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: 1, cursor: 'pointer',
                    minHeight: 48
                  }}
                >
                  😔 Не знав
                </button>
                <button
                  onClick={() => handleRate(3)}
                  style={{
                    flex: 1, padding: '12px 8px', borderRadius: 10, border: '1px solid var(--orange)',
                    background: 'rgba(255,123,0,0.1)', color: 'var(--orange)',
                    fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: 1, cursor: 'pointer',
                    minHeight: 48
                  }}
                >
                  😕 Важко
                </button>
                <button
                  onClick={() => handleRate(5)}
                  style={{
                    flex: 1, padding: '12px 8px', borderRadius: 10, border: '1px solid var(--good)',
                    background: 'rgba(46,204,113,0.1)', color: 'var(--good)',
                    fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: 1, cursor: 'pointer',
                    minHeight: 48
                  }}
                >
                  😊 Знав!
                </button>
              </div>

              <div style={{
                marginTop: 12, fontSize: 11, color: 'var(--text-mute)',
                textAlign: 'center', letterSpacing: 0.5
              }}>
                «Не знав» — картка повернеться завтра · «Знав!» — через {Math.round(current.card.interval * 2.5) || 6} днів
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
