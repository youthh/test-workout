'use client';
import { useState, useMemo } from 'react';
import { TOPICS } from '../data/topics';
import type { Question } from '../types';

interface FlashCard {
  question: string;
  answer: string;
  explanation: string;
  topicTitle: string;
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildCards(topicId: string): FlashCard[] {
  const topics = topicId === '_all' ? TOPICS : TOPICS.filter(t => t.id === topicId);
  const cards: FlashCard[] = [];
  topics.forEach(t => {
    t.questions.forEach((q: Question) => {
      cards.push({
        question: q.q,
        answer: q.a[q.c],
        explanation: q.e,
        topicTitle: t.title,
      });
    });
  });
  return shuffleArray(cards);
}

interface FlashcardsScreenProps {
  onBack: () => void;
}

export default function FlashcardsScreen({ onBack }: FlashcardsScreenProps) {
  const [topicId, setTopicId] = useState('_all');
  const [cards, setCards] = useState<FlashCard[]>(() => buildCards('_all'));
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<number[]>([]);
  const [unknown, setUnknown] = useState<number[]>([]);

  const card = cards[idx];
  const progress = cards.length > 0 ? Math.round((idx) / cards.length * 100) : 0;

  function changeTopic(id: string) {
    setTopicId(id);
    const newCards = buildCards(id);
    setCards(newCards);
    setIdx(0);
    setFlipped(false);
    setKnown([]);
    setUnknown([]);
  }

  function handleKnow() {
    setKnown(k => [...k, idx]);
    next();
  }

  function handleDontKnow() {
    setUnknown(u => [...u, idx]);
    next();
  }

  function next() {
    setFlipped(false);
    setTimeout(() => setIdx(i => Math.min(i + 1, cards.length)), 150);
  }

  function prev() {
    if (idx === 0) return;
    setFlipped(false);
    setTimeout(() => setIdx(i => Math.max(i - 1, 0)), 150);
  }

  function restart() {
    const newCards = buildCards(topicId);
    setCards(newCards);
    setIdx(0);
    setFlipped(false);
    setKnown([]);
    setUnknown([]);
  }

  const done = idx >= cards.length;

  return (
    <div className="quiz-screen active">
      <div className="container">
        <div className="quiz-header">
          <button className="back-btn" onClick={onBack}>← Назад</button>
          <div className="quiz-title">Флеш-картки</div>
          <div className="quiz-counter">
            <b>{Math.min(idx + 1, cards.length)}</b><span>/{cards.length}</span>
          </div>
        </div>

        <div className="fc-controls">
          <select
            className="fc-topic-select"
            value={topicId}
            onChange={e => changeTopic(e.target.value)}
          >
            <option value="_all">Усі теми</option>
            {TOPICS.map(t => (
              <option key={t.id} value={t.id}>{t.icon} {t.title}</option>
            ))}
          </select>
          <span className="fc-count">
            ✅ {known.length} · ❌ {unknown.length}
          </span>
        </div>

        <div className="progress" style={{ marginBottom: 20 }}>
          <div className="progress-bar" style={{ width: progress + '%' }} />
        </div>

        {done ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>🎓</div>
            <div style={{ fontFamily: 'Impact, sans-serif', fontSize: 28, color: 'var(--good)', letterSpacing: 2, marginBottom: 8 }}>
              ГОТОВО!
            </div>
            <div style={{ color: 'var(--text-dim)', marginBottom: 24 }}>
              Знаю: {known.length} · Не знаю: {unknown.length}
            </div>
            <button className="btn-primary" onClick={restart}>Пройти ще раз</button>
          </div>
        ) : (
          <>
            <div className="fc-scene" onClick={() => setFlipped(f => !f)}>
              <div className={`fc-card${flipped ? ' flipped' : ''}`}>
                <div className="fc-face fc-front">
                  <div className="fc-label" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>
                    {card?.topicTitle}
                  </div>
                  <div style={{ fontSize: 'clamp(14px, 3.5vw, 18px)', lineHeight: 1.5, textAlign: 'center' }}>
                    {card?.question}
                  </div>
                  <div style={{ marginTop: 16, fontSize: 12, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: 1 }}>
                    Натисни, щоб побачити відповідь
                  </div>
                </div>
                <div className="fc-face fc-back">
                  <div className="fc-label" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, color: 'var(--good)', marginBottom: 12 }}>
                    Відповідь
                  </div>
                  <div style={{ fontSize: 'clamp(13px, 3vw, 16px)', fontWeight: 700, marginBottom: 12, textAlign: 'center' }}>
                    {card?.answer}
                  </div>
                  {card?.explanation && (
                    <div style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.5, textAlign: 'center' }}>
                      {card.explanation}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <button className="btn-secondary" onClick={prev} disabled={idx === 0} style={{ flex: 1 }}>
                ← Назад
              </button>
              <button className="btn-secondary" onClick={next} style={{ flex: 1 }}>
                Далі →
              </button>
            </div>

            {flipped && (
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  className="btn-secondary"
                  onClick={handleDontKnow}
                  style={{ flex: 1, borderColor: 'var(--accent)', color: 'var(--accent)' }}
                >
                  ❌ Не знаю
                </button>
                <button
                  className="btn-primary"
                  onClick={handleKnow}
                  style={{ flex: 1 }}
                >
                  ✅ Знаю
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
