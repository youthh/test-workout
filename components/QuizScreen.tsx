'use client';
import { useEffect, useRef, useCallback, useState } from 'react';
import type { QuizState, AnswerRecord } from '../types';

const QUESTION_TIME = 30;
const LETTERS = ['A', 'B', 'C', 'D'];

interface QuizScreenProps {
  state: QuizState;
  onAnswer: (chosenIdx: number, correct: boolean) => void;
  onNext: () => void;
  onBack: () => void;
  onJump: (idx: number) => void;
  onUseHint: () => void;
  onTimeout: () => void;
  onToast: (msg: string) => void;
}

export default function QuizScreen({
  state, onAnswer, onNext, onBack, onJump, onUseHint, onTimeout, onToast,
}: QuizScreenProps) {
  const rafRef = useRef<number | null>(null);
  const timerStartRef = useRef<number>(0);
  const barRef = useRef<HTMLDivElement>(null);
  const txtRef = useRef<HTMLSpanElement>(null);

  const [exitModal, setExitModal] = useState(false);
  const { topic, qIdx, order, locked, hintsLeft, removedByHint, answeredHistory, timerOn } = state;

  const stopTimer = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  useEffect(() => {
    stopTimer();
    if (!timerOn || locked) return;
    const savedAnswer = answeredHistory[qIdx];
    if (savedAnswer) return;

    timerStartRef.current = performance.now();
    function tick(now: number) {
      const elapsed = (now - timerStartRef.current) / 1000;
      const remaining = QUESTION_TIME - elapsed;
      if (barRef.current) barRef.current.style.width = Math.max(0, remaining / QUESTION_TIME * 100) + '%';
      if (txtRef.current) txtRef.current.textContent = String(Math.ceil(Math.max(0, remaining)));
      if (remaining < 5) barRef.current?.classList.add('low');
      else barRef.current?.classList.remove('low');
      if (remaining <= 0) {
        stopTimer();
        onTimeout();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => stopTimer();
  }, [qIdx, timerOn, locked, stopTimer, onTimeout, answeredHistory]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const map: Record<string, number> = { a: 0, b: 1, c: 2, d: 3 };
      const key = e.key.toLowerCase();
      if (key in map && !locked) {
        const idx = map[key];
        if (!removedByHint.includes(idx)) handleAnswer(idx);
      }
      if ((key === 'enter' || key === ' ') && locked) onNext();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [locked, removedByHint, qIdx]);

  if (!topic) return null;

  const realIdx = order[qIdx];
  const q = topic.questions[realIdx];
  const saved: AnswerRecord | null = answeredHistory[qIdx] ?? null;
  const total = topic.questions.length;
  const hist = answeredHistory;
  const progressPct = ((qIdx + (saved ? 1 : 0)) / total * 100);

  let okN = 0, badN = 0;
  hist.forEach(h => { if (h) { h.correct ? okN++ : badN++; } });
  const leftN = total - okN - badN;

  const correctIdx = q.c;

  function handleAnswer(i: number) {
    if (locked) return;
    const isCorrect = i === correctIdx;
    onAnswer(i, isCorrect);
  }

  function handleHint() {
    if (hintsLeft <= 0 || locked) return;
    onUseHint();
  }

  function getOptionClass(i: number): string {
    let cls = 'option';
    if (removedByHint.includes(i)) cls += ' hint-hidden';
    if (!saved) return cls;
    if (i === correctIdx) cls += ' correct';
    else if (i === saved.chosen) cls += ' wrong';
    return cls;
  }

  function handleReport() {
    const text = `Звіт: Помилка в питанні "${q.q}" (тема: ${topic?.title ?? ''})`;
    navigator.clipboard?.writeText(text).catch(() => {});
    onToast('Текст помилки скопійовано');
  }

  return (
    <div className="quiz-screen active">
      {exitModal && (
        <div className="exit-overlay" onClick={() => setExitModal(false)}>
          <div className="exit-box" onClick={e => e.stopPropagation()}>
            <div className="exit-box-icon">⚠️</div>
            <div className="exit-box-title">Вийти з тесту?</div>
            <div className="exit-box-desc">Прогрес буде збережено — зможеш продовжити пізніше</div>
            <div className="exit-box-btns">
              <button className="exit-stay" onClick={() => setExitModal(false)}>Залишитись</button>
              <button className="exit-leave" onClick={onBack}>Вийти</button>
            </div>
          </div>
        </div>
      )}
      <div className="container">
        <div className="quiz-header">
          <button className="back-btn" onClick={() => qIdx > 0 ? onJump(qIdx - 1) : setExitModal(true)}>
            ← Назад
          </button>
          <div className="quiz-title">{topic.title}</div>
          <div className="quiz-counter">
            <b id="q-current">{qIdx + 1}</b>
            <span> / </span>
            <span id="q-total">{total}</span>
          </div>
        </div>

        <div className="progress">
          <div className="progress-bar" style={{ width: progressPct + '%' }} />
        </div>

        {/* Question tracker */}
        <div className="q-tracker-wrap">
          <div className="q-tracker">
            {Array.from({ length: total }, (_, i) => {
              let cls = 'q-cell';
              if (i === qIdx) cls += ' current';
              const h = hist[i];
              if (h) cls += h.correct ? ' correct' : ' wrong';
              return (
                <button key={i} className={cls} onClick={() => onJump(i)} title={`Питання ${i + 1}`}>
                  {i + 1}
                </button>
              );
            })}
          </div>
          <div className="q-stats">
            <span><b className="ok">{okN}</b>правильно</span>
            <span><b className="er">{badN}</b>помилок</span>
            <span><b>{leftN}</b>залишилось</span>
          </div>
        </div>

        {/* Timer */}
        {timerOn && (
          <div className="timer-row">
            <div className="timer-track">
              <div className="timer-fill" ref={barRef} style={{ width: '100%' }} />
            </div>
            <span className="timer-text" ref={txtRef}>{QUESTION_TIME}</span>
          </div>
        )}

        {/* Hint */}
        {!saved && (
          <button
            className={`hint-btn${hintsLeft <= 0 ? ' used' : ''}`}
            onClick={handleHint}
            disabled={hintsLeft <= 0 || locked}
          >
            <span>💡 Підказка — прибрати 2 неправильних</span>
            <span className="hint-pill">{hintsLeft} залишилось</span>
          </button>
        )}

        {/* Question card */}
        <div className="question-card">
          <div className="question">{q.q}</div>
          <div className="options">
            {q.a.map((ans, i) => (
              <button
                key={i}
                className={getOptionClass(i)}
                onClick={() => handleAnswer(i)}
                disabled={locked || removedByHint.includes(i)}
              >
                <span className="option-letter">{LETTERS[i]}</span>
                {ans}
              </button>
            ))}
          </div>

          {!saved && (
            <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-mute)', letterSpacing: 1, textAlign: 'right' }}>
              клавіші A · B · C · D · Enter
            </div>
          )}

          {saved && (
            <div className="explanation show">
              <span className={`verdict ${saved.correct ? 'good' : 'bad'}`}>
                {saved.correct ? 'Вірно' : 'Помилка'}
              </span>
              {q.e}
              <div className="report-row">
                <button className="report-link" onClick={handleReport}>
                  ⚑ Повідомити про помилку
                </button>
              </div>
            </div>
          )}

          {saved && (
            <button className="next-btn show" onClick={onNext}>
              {qIdx + 1 < total ? 'Наступне питання →' : 'Завершити тест →'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
