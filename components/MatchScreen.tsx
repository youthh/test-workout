'use client';
import { useState, useCallback } from 'react';
import { MATCH_PAIRS } from '../data/matchPairs';

const GAME_SIZE = 6;

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface MatchPairItem {
  term: string;
  match: string;
}

interface MatchState {
  pairs: MatchPairItem[];
  shuffledMatches: string[];
  matched: number[];
  selectedTerm: number | null;
  selectedMatch: number | null;
  shakingMatch: number | null;
  attempts: number;
  correct: number;
}

function newGame(): MatchState {
  const pairs = shuffleArray(MATCH_PAIRS).slice(0, GAME_SIZE);
  const shuffledMatches = shuffleArray(pairs.map(p => p.match));
  return {
    pairs,
    shuffledMatches,
    matched: [],
    selectedTerm: null,
    selectedMatch: null,
    shakingMatch: null,
    attempts: 0,
    correct: 0,
  };
}

interface MatchScreenProps {
  onBack: () => void;
}

export default function MatchScreen({ onBack }: MatchScreenProps) {
  const [state, setState] = useState<MatchState>(newGame);

  const handleTermClick = useCallback((idx: number) => {
    setState(prev => {
      if (prev.matched.includes(idx)) return prev;
      return { ...prev, selectedTerm: prev.selectedTerm === idx ? null : idx, selectedMatch: null };
    });
  }, []);

  const handleMatchClick = useCallback((matchIdx: number) => {
    setState(prev => {
      if (prev.selectedTerm === null) return prev;

      const termIdx = prev.selectedTerm;
      const correctMatch = prev.pairs[termIdx].match;
      const chosenMatch = prev.shuffledMatches[matchIdx];
      const isCorrect = correctMatch === chosenMatch;

      const newAttempts = prev.attempts + 1;
      const newCorrect = isCorrect ? prev.correct + 1 : prev.correct;

      if (isCorrect) {
        return {
          ...prev,
          matched: [...prev.matched, termIdx],
          selectedTerm: null,
          selectedMatch: null,
          attempts: newAttempts,
          correct: newCorrect,
          shakingMatch: null,
        };
      } else {
        return {
          ...prev,
          selectedTerm: null,
          selectedMatch: null,
          attempts: newAttempts,
          shakingMatch: matchIdx,
        };
      }
    });

    if (state.selectedTerm !== null) {
      const correctMatch = state.pairs[state.selectedTerm].match;
      const chosenMatch = state.shuffledMatches[matchIdx];
      if (correctMatch !== chosenMatch) {
        setTimeout(() => {
          setState(prev => ({ ...prev, shakingMatch: null }));
        }, 450);
      }
    }
  }, [state.selectedTerm, state.pairs, state.shuffledMatches]);

  const won = state.matched.length === GAME_SIZE;
  const accuracy = state.attempts > 0 ? Math.round(state.correct / state.attempts * 100) : 0;

  const matchedMatchIndices = new Set(
    state.matched.map(termIdx => {
      const correctMatch = state.pairs[termIdx].match;
      return state.shuffledMatches.indexOf(correctMatch);
    })
  );

  return (
    <div className="quiz-screen active">
      <div className="container">
        <div className="quiz-header">
          <button className="back-btn" onClick={onBack}>← Назад</button>
          <div className="quiz-title">Match-гра</div>
          <div />
        </div>

        <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
          <div className="match-stat">
            <div className="val accent">{state.attempts}</div>
            <div className="lbl">спроб</div>
          </div>
          <div className="match-stat">
            <div className={`val ${accuracy >= 70 ? 'good' : 'accent'}`}>{accuracy}%</div>
            <div className="lbl">точність</div>
          </div>
          <div className="match-stat">
            <div className="val good">{state.matched.length}/{GAME_SIZE}</div>
            <div className="lbl">зʼєднано</div>
          </div>
        </div>

        {won ? (
          <div className="match-win">
            <div className="emj">🎉</div>
            <div className="ttl">ПЕРЕМОГА!</div>
            <div className="sub">{state.attempts} спроб · {accuracy}% точність</div>
          </div>
        ) : (
          <div className="match-grid">
            <div className="match-col">
              <div className="match-col-label">Термін</div>
              {state.pairs.map((p, i) => {
                const isMatched = state.matched.includes(i);
                const isSelected = state.selectedTerm === i;
                let cls = 'match-item';
                if (isMatched) cls += ' matched';
                else if (isSelected) cls += ' selected';
                return (
                  <button key={i} className={cls} onClick={() => handleTermClick(i)} disabled={isMatched}>
                    {p.term}
                  </button>
                );
              })}
            </div>
            <div className="match-col">
              <div className="match-col-label">Визначення</div>
              {state.shuffledMatches.map((m, i) => {
                const isMatched = matchedMatchIndices.has(i);
                const isShaking = state.shakingMatch === i;
                let cls = 'match-item';
                if (isMatched) cls += ' matched';
                if (isShaking) cls += ' shake';
                return (
                  <button key={i} className={cls} onClick={() => handleMatchClick(i)} disabled={isMatched || state.selectedTerm === null}>
                    {m}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="match-actions">
          <button className="btn-primary" onClick={() => setState(newGame())}>
            Нова гра
          </button>
          <button className="btn-secondary" onClick={onBack}>
            Готово
          </button>
        </div>
      </div>
    </div>
  );
}
