'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { TOPICS } from '../data/topics';
import type { Topic, Question } from '../types';

const LETTERS = ['A', 'B', 'C', 'D'];

type Phase = 'setup' | 'exam' | 'results';

interface SimQuestion {
  question: Question;
  topicTitle: string;
  chosen: number | null;
}

interface ExamSimulatorScreenProps {
  onBack: () => void;
  onToast: (msg: string) => void;
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildPool(topicId: string | 'all', count: number): SimQuestion[] {
  const pool: Array<{ question: Question; topicTitle: string }> = [];
  const topics = topicId === 'all' ? TOPICS : TOPICS.filter(t => t.id === topicId);
  topics.forEach(t => t.questions.forEach(q => pool.push({ question: q, topicTitle: t.title })));
  return shuffleArray(pool).slice(0, Math.min(count, pool.length)).map(p => ({ ...p, chosen: null }));
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function ExamSimulatorScreen({ onBack, onToast }: ExamSimulatorScreenProps) {
  const [phase, setPhase] = useState<Phase>('setup');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [questionCount, setQuestionCount] = useState<number>(25);
  const [timerEnabled, setTimerEnabled] = useState(true);
  const [questions, setQuestions] = useState<SimQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showReview, setShowReview] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const finishExam = useCallback((qs: SimQuestion[], elapsed: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setElapsedSeconds(elapsed);
    setQuestions(qs);
    setPhase('results');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (phase !== 'exam' || !timerEnabled) return;
    const totalSeconds = questionCount * 72; // ~72 сек на питання
    setTimeLeft(totalSeconds);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          finishExam(questions, totalSeconds);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, timerEnabled, questionCount, finishExam]);

  function startExam() {
    const qs = buildPool(selectedTopic, questionCount);
    if (!qs.length) { onToast('Немає питань для вибраних параметрів'); return; }
    setQuestions(qs);
    setCurrentIdx(0);
    setStartTime(Date.now());
    setElapsedSeconds(0);
    setShowReview(false);
    setPhase('exam');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleChoose(idx: number) {
    setQuestions(prev => {
      const updated = [...prev];
      updated[currentIdx] = { ...updated[currentIdx], chosen: idx };
      return updated;
    });
  }

  function handleNext() {
    if (currentIdx + 1 >= questions.length) {
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      finishExam(questions, elapsed);
    } else {
      setCurrentIdx(i => i + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function handlePrev() {
    if (currentIdx > 0) setCurrentIdx(i => i - 1);
  }

  // === SETUP ===
  if (phase === 'setup') {
    const totalAll = TOPICS.reduce((s, t) => s + t.questions.length, 0);
    const maxForTopic = selectedTopic === 'all'
      ? totalAll
      : (TOPICS.find(t => t.id === selectedTopic)?.questions.length ?? 0);
    const counts = [10, 25, 50].filter(n => n <= maxForTopic);
    if (counts[counts.length - 1] !== maxForTopic && maxForTopic > 0) counts.push(maxForTopic);

    return (
      <div className="quiz-screen active">
        <div className="container">
          <div className="quiz-header">
            <button className="back-btn" onClick={onBack}>← Назад</button>
            <div className="quiz-title">Симулятор іспиту</div>
            <div />
          </div>

          <div className="question-card" style={{ maxWidth: 560, margin: '0 auto' }}>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 12, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>
                Тема
              </div>
              <select
                value={selectedTopic}
                onChange={e => { setSelectedTopic(e.target.value); setQuestionCount(25); }}
                style={{
                  width: '100%', background: '#1d1d1d', border: '1px solid var(--border)',
                  color: 'var(--text)', borderRadius: 8, padding: '10px 12px',
                  fontFamily: 'inherit', fontSize: 14, cursor: 'pointer'
                }}
              >
                <option value="all">Всі теми ({totalAll} питань)</option>
                {TOPICS.map(t => (
                  <option key={t.id} value={t.id}>{t.title} ({t.questions.length})</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 12, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>
                Кількість питань
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {counts.map(n => (
                  <button
                    key={n}
                    onClick={() => setQuestionCount(n)}
                    style={{
                      flex: '1 1 60px', padding: '10px 8px', borderRadius: 8,
                      border: `1px solid ${questionCount === n ? 'var(--accent)' : 'var(--border)'}`,
                      background: questionCount === n ? 'rgba(230,57,70,0.12)' : '#1d1d1d',
                      color: questionCount === n ? 'var(--accent)' : 'var(--text-dim)',
                      fontFamily: 'inherit', fontSize: 14, fontWeight: 700,
                      cursor: 'pointer', transition: 'all .15s'
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div
              onClick={() => setTimerEnabled(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 14px', borderRadius: 10, cursor: 'pointer', marginBottom: 28,
                border: `1px solid ${timerEnabled ? 'var(--accent)' : 'var(--border)'}`,
                background: timerEnabled ? 'rgba(230,57,70,0.07)' : '#1d1d1d',
                transition: 'all .2s'
              }}
            >
              <span style={{ color: timerEnabled ? 'var(--text)' : 'var(--text-dim)', fontSize: 14 }}>
                ⏱ Таймер (~{Math.round(questionCount * 72 / 60)} хв)
              </span>
              <span style={{
                width: 36, height: 20, borderRadius: 12, position: 'relative',
                background: timerEnabled ? 'var(--accent)' : '#2a2a2a',
                transition: 'background .2s', flexShrink: 0
              }}>
                <span style={{
                  position: 'absolute', top: 2,
                  left: timerEnabled ? 18 : 2,
                  width: 16, height: 16, borderRadius: '50%',
                  background: '#fff', transition: 'left .2s'
                }} />
              </span>
            </div>

            <div style={{ background: 'rgba(230,57,70,0.06)', border: '1px solid rgba(230,57,70,0.2)', borderRadius: 10, padding: '12px 14px', marginBottom: 24, fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.6 }}>
              ⚠️ У цьому режимі <b style={{ color: 'var(--text)' }}>немає зворотного зв'язку</b> під час іспиту. Правильні відповіді побачиш тільки в кінці — як на реальному іспиті.
            </div>

            <button className="next-btn show" onClick={startExam}>
              Почати іспит →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // === EXAM ===
  if (phase === 'exam') {
    const current = questions[currentIdx];
    const { question, chosen } = current;
    const answered = questions.filter(q => q.chosen !== null).length;
    const pct = (currentIdx / questions.length) * 100;
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    const totalSeconds = questionCount * 72;

    return (
      <div className="quiz-screen active">
        <div className="container">
          <div className="quiz-header">
            <button className="back-btn" onClick={() => {
              if (confirm('Вийти з іспиту? Прогрес буде втрачено.')) onBack();
            }}>✕ Вийти</button>
            <div className="quiz-title">Симулятор іспиту</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {timerEnabled && (
                <span style={{
                  fontFamily: 'Impact, sans-serif', fontSize: 16,
                  color: timeLeft < 60 ? 'var(--bad)' : 'var(--text-dim)'
                }}>
                  ⏱ {formatTime(timeLeft)}
                </span>
              )}
              <span className="quiz-counter">
                <b style={{ color: 'var(--accent)' }}>{currentIdx + 1}</b>/{questions.length}
              </span>
            </div>
          </div>

          <div className="progress" style={{ marginBottom: 6 }}>
            <div className="progress-bar" style={{ width: pct + '%' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-mute)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 20 }}>
            <span>Дано відповідь: {answered}/{questions.length}</span>
            {!timerEnabled && <span>Час: {formatTime(elapsed)}</span>}
          </div>

          <div className="question-card">
            <div className="question">{question.q}</div>
            <div className="options">
              {question.a.map((ans, i) => (
                <button
                  key={i}
                  className="option"
                  onClick={() => handleChoose(i)}
                  style={{
                    borderColor: chosen === i ? 'var(--accent)' : undefined,
                    background: chosen === i ? 'rgba(230,57,70,0.12)' : undefined,
                  }}
                >
                  <span className="option-letter" style={chosen === i ? { background: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)' } : {}}>
                    {LETTERS[i]}
                  </span>
                  {ans}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            {currentIdx > 0 && (
              <button className="back-btn" onClick={handlePrev} style={{ flex: 1 }}>
                ← Назад
              </button>
            )}
            <button
              className="next-btn show"
              onClick={handleNext}
              style={{ flex: 3, marginTop: 0 }}
            >
              {currentIdx + 1 >= questions.length ? 'Завершити іспит →' : 'Наступне →'}
            </button>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 16 }}>
            {questions.map((q, i) => (
              <button
                key={i}
                onClick={() => setCurrentIdx(i)}
                style={{
                  width: 26, height: 26, borderRadius: 5, border: '2px solid',
                  borderColor: i === currentIdx ? 'var(--orange)' : q.chosen !== null ? 'var(--accent)' : 'var(--border)',
                  background: i === currentIdx ? '#2a2a2a' : q.chosen !== null ? 'rgba(230,57,70,0.15)' : '#1d1d1d',
                  color: i === currentIdx ? '#fff' : q.chosen !== null ? 'var(--accent)' : '#555',
                  fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'all .12s', flexShrink: 0
                }}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // === RESULTS ===
  const correct = questions.filter(q => q.chosen === q.question.c).length;
  const total = questions.length;
  const pct = Math.round(correct / total * 100);
  const passed = pct >= 50;

  return (
    <div className="quiz-screen active">
      <div className="container">
        <div className="quiz-header">
          <button className="back-btn" onClick={onBack}>← До тем</button>
          <div className="quiz-title">Результати іспиту</div>
          <div />
        </div>

        <div className="result-card" style={{ marginBottom: 24 }}>
          <div className="result-emoji">{pct >= 85 ? '🏆' : pct >= 50 ? '💪' : '📚'}</div>
          <div className="result-title" style={{ color: passed ? 'var(--good)' : 'var(--bad)' }}>
            {passed ? 'Іспит складено!' : 'Іспит не складено'}
          </div>
          <div className="score-big">{pct}%</div>
          <div className="score-detail">
            {correct} / {total} правильних · {formatTime(elapsedSeconds)}
          </div>
          <div className="actions">
            <button className="btn-primary" onClick={() => { setShowReview(v => !v); }}>
              {showReview ? 'Сховати розбір' : '🔍 Розбір відповідей'}
            </button>
            <button className="btn-secondary" onClick={() => setPhase('setup')}>Ще раз</button>
            <button className="btn-secondary" onClick={onBack}>← До тем</button>
          </div>
        </div>

        {showReview && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 40 }}>
            <div className="section-label">Розбір відповідей</div>
            {questions.map((q, i) => {
              const isCorrect = q.chosen === q.question.c;
              const isSkipped = q.chosen === null;
              return (
                <div
                  key={i}
                  style={{
                    background: 'var(--bg-card)', border: `1px solid ${isCorrect ? 'rgba(46,204,113,0.3)' : 'rgba(230,57,70,0.3)'}`,
                    borderRadius: 12, padding: '16px 18px'
                  }}
                >
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
                    <span style={{
                      width: 22, height: 22, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                      background: isCorrect ? 'var(--good)' : 'var(--bad)',
                      color: '#fff', fontSize: 12, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {isCorrect ? '✓' : '✗'}
                    </span>
                    <div style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.5 }}>
                      <b style={{ fontSize: 11, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: 1 }}>
                        {i + 1}. {q.topicTitle}
                      </b>
                      <br />
                      {q.question.q}
                    </div>
                  </div>

                  {!isCorrect && (
                    <div style={{ marginLeft: 32, fontSize: 13, marginBottom: 8 }}>
                      {!isSkipped && (
                        <div style={{ color: 'var(--bad)', marginBottom: 4 }}>
                          Ваша відповідь: <b>{LETTERS[q.chosen!]}. {q.question.a[q.chosen!]}</b>
                        </div>
                      )}
                      {isSkipped && (
                        <div style={{ color: 'var(--text-mute)', marginBottom: 4 }}>Без відповіді</div>
                      )}
                      <div style={{ color: 'var(--good)' }}>
                        Правильно: <b>{LETTERS[q.question.c]}. {q.question.a[q.question.c]}</b>
                      </div>
                    </div>
                  )}

                  {q.question.e && (
                    <div style={{
                      marginLeft: 32, fontSize: 12, color: 'var(--text-dim)',
                      lineHeight: 1.6, borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 8
                    }}>
                      {q.question.e}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
