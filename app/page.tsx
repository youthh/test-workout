'use client';
import { useState, useCallback, useEffect } from 'react';
import { TOPICS } from '../data/topics';
import { ACHIEVEMENTS_DATA } from '../data/achievements';
import type { QuizState, ResultData, Topic, AnswerRecord } from '../types';
import TopicCard from '../components/TopicCard';
import QuizScreen from '../components/QuizScreen';
import ResultScreen from '../components/ResultScreen';
import Toast from '../components/Toast';
import StatsScreen from '../components/StatsScreen';
import type { Stats } from '../components/StatsScreen';
import AchievementsScreen from '../components/AchievementsScreen';
import GlossaryScreen from '../components/GlossaryScreen';
import AnatomyScreen from '../components/AnatomyScreen';
import MatchScreen from '../components/MatchScreen';
import FlashcardsScreen from '../components/FlashcardsScreen';
import ComboIndicator from '../components/ComboIndicator';
import AchievementToast from '../components/AchievementToast';
import WelcomeModal from '../components/WelcomeModal';
import SRSScreen from '../components/SRSScreen';
import ExamSimulatorScreen from '../components/ExamSimulatorScreen';
import type { Achievement } from '../data/achievements';

const INITIAL_HINTS = 3;

type Screen = 'home' | 'quiz' | 'result' | 'stats' | 'achievements' | 'glossary' | 'anatomy' | 'match' | 'flashcards' | 'srs' | 'simulator';

const DEFAULT_STATS: Stats = {
  totalAnswered: 0,
  totalCorrect: 0,
  byTopic: {},
  byDate: {},
  bestCombo: 0,
  quizzesCompleted: 0,
  examsPassed: 0,
};

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function loadJSON<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; }
}

function saveJSON(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

function checkAndUnlockAchievements(ctx: {
  pct: number;
  isExam: boolean;
  isMistakes: boolean;
  stats: Stats;
  achievements: string[];
  topicIds: string[];
}): string[] {
  const newlyUnlocked: string[] = [];
  const checks: Record<string, boolean> = {
    first_quiz: ctx.stats.quizzesCompleted >= 1,
    first_perfect: ctx.pct === 100 && !ctx.isMistakes,
    exam_pass: ctx.isExam && ctx.pct >= 50,
    exam_perfect: ctx.isExam && ctx.pct === 100,
    hundred: ctx.stats.totalAnswered >= 100,
    thousand: ctx.stats.totalAnswered >= 1000,
    combo_5: ctx.stats.bestCombo >= 5,
    combo_10: ctx.stats.bestCombo >= 10,
    no_mistakes: ctx.pct === 100 && !ctx.isExam && !ctx.isMistakes,
    all_topics: ctx.topicIds.every(id => ctx.stats.byTopic[id] && ctx.stats.byTopic[id].answered > 0),
    night_owl: new Date().getHours() < 6,
    early_bird: new Date().getHours() >= 5 && new Date().getHours() < 8,
  };
  for (const [id, condition] of Object.entries(checks)) {
    if (condition && !ctx.achievements.includes(id)) newlyUnlocked.push(id);
  }
  return newlyUnlocked;
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>('home');
  const [quizState, setQuizState] = useState<QuizState | null>(null);
  const [result, setResult] = useState<ResultData | null>(null);
  const [toast, setToast] = useState('');
  const [shuffleByTopic, setShuffleByTopic] = useState<Record<string, boolean>>({});
  const [timerByTopic, setTimerByTopic] = useState<Record<string, boolean>>({});
  const [mistakes, setMistakes] = useState<Record<string, number[]>>({});
  const [stats, setStats] = useState<Stats>(DEFAULT_STATS);
  const [history, setHistory] = useState<Record<string, Array<{ date: string; score: number; total: number; pct: number }>>>({});
  const [achievements, setAchievements] = useState<string[]>([]);
  const [achievementToast, setAchievementToast] = useState<Achievement | null>(null);
  const [achievementQueue, setAchievementQueue] = useState<Achievement[]>([]);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    setShuffleByTopic(loadJSON('shuffleByTopic', {}));
    setTimerByTopic(loadJSON('timerByTopic', {}));
    setMistakes(loadJSON('mistakes', {}));
    setStats(loadJSON('stats', DEFAULT_STATS));
    setHistory(loadJSON('history', {}));
    setAchievements(loadJSON('achievements', []));
    setStreak(loadJSON('streak', 0));
  }, []);

  useEffect(() => {
    if (achievementQueue.length > 0 && !achievementToast) {
      const [next, ...rest] = achievementQueue;
      setAchievementToast(next);
      setAchievementQueue(rest);
    }
  }, [achievementQueue, achievementToast]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
  }, []);

  function startQuiz(topicIdx: number) {
    const topic = TOPICS[topicIdx];
    const doShuffle = !!shuffleByTopic[topic.id];
    const indices = Array.from({ length: topic.questions.length }, (_, i) => i);
    const order = doShuffle ? shuffleArray(indices) : indices;
    setQuizState({
      topic, topicIdx, qIdx: 0, score: 0, locked: false, order,
      isExam: false, isMistakes: false, combo: 0, maxCombo: 0,
      hintsLeft: INITIAL_HINTS, timerOn: !!timerByTopic[topic.id],
      removedByHint: [], answeredHistory: Array(topic.questions.length).fill(null),
    });
    setScreen('quiz');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function startMistakes(e: React.MouseEvent, topicIdx: number) {
    e.stopPropagation(); e.preventDefault();
    const baseTopic = TOPICS[topicIdx];
    const ids = (mistakes[baseTopic.id] || []).slice();
    if (!ids.length) { showToast('Немає помилок — нічого повторювати'); return; }
    const questions = ids.map(i => baseTopic.questions[i]);
    const mistakeTopic: Topic = {
      id: baseTopic.id, icon: baseTopic.icon,
      title: baseTopic.title + ' — Помилки',
      desc: baseTopic.desc, questions,
    };
    const indices = Array.from({ length: questions.length }, (_, i) => i);
    setQuizState({
      topic: mistakeTopic, topicIdx, qIdx: 0, score: 0, locked: false,
      order: shuffleArray(indices), isExam: false, isMistakes: true,
      combo: 0, maxCombo: 0, hintsLeft: INITIAL_HINTS, timerOn: false,
      removedByHint: [], answeredHistory: Array(questions.length).fill(null),
      sourceIndices: ids,
    });
    setScreen('quiz');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function startExam() {
    const pool: Array<{ q: Topic['questions'][0]; topicId: string; qIdx: number }> = [];
    TOPICS.forEach(t => {
      t.questions.forEach((q, i) => pool.push({ q, topicId: t.id, qIdx: i }));
    });
    const sampled = shuffleArray(pool).slice(0, 25);
    const examTopic: Topic = {
      id: '_exam', icon: '🏆', title: 'Тренер чи ні?',
      desc: '', questions: sampled.map(s => s.q),
    };
    const sources = sampled.map(s => ({ topicId: s.topicId, qIdx: s.qIdx }));
    const indices = Array.from({ length: examTopic.questions.length }, (_, i) => i);
    setQuizState({
      topic: examTopic, topicIdx: -1, qIdx: 0, score: 0, locked: false,
      order: indices, isExam: true, isMistakes: false,
      combo: 0, maxCombo: 0, hintsLeft: INITIAL_HINTS, timerOn: false,
      removedByHint: [], answeredHistory: Array(examTopic.questions.length).fill(null),
      sources,
    });
    setScreen('quiz');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleAnswer(chosenIdx: number, correct: boolean) {
    if (!quizState) return;
    const { topic, qIdx, order, isMistakes, sourceIndices } = quizState;
    if (!topic) return;

    const realIdx = order[qIdx];
    const record: AnswerRecord = { correct, chosen: chosenIdx };
    const newHistory = [...quizState.answeredHistory];
    newHistory[qIdx] = record;

    const newScore = correct ? quizState.score + 1 : quizState.score;
    const newCombo = correct ? quizState.combo + 1 : 0;
    const newMaxCombo = Math.max(quizState.maxCombo, newCombo);

    // Update mistakes in localStorage
    const newMistakes = { ...mistakes };
    let topicId = topic.id;
    let actualQIdx = realIdx;
    if (isMistakes && sourceIndices) actualQIdx = sourceIndices[realIdx];
    if (topic.id === '_exam' && quizState.sources) {
      topicId = quizState.sources[realIdx].topicId;
      actualQIdx = quizState.sources[realIdx].qIdx;
    }

    if (!correct) {
      const cur = newMistakes[topicId] || [];
      if (!cur.includes(actualQIdx)) {
        newMistakes[topicId] = [...cur, actualQIdx];
        saveJSON('mistakes', newMistakes);
        setMistakes(newMistakes);
      }
    } else {
      const cur = newMistakes[topicId] || [];
      if (cur.includes(actualQIdx)) {
        newMistakes[topicId] = cur.filter(i => i !== actualQIdx);
        saveJSON('mistakes', newMistakes);
        setMistakes(newMistakes);
      }
    }

    // Update stats
    const newStats = { ...stats };
    const todayKey = new Date().toISOString().slice(0, 10);
    newStats.totalAnswered++;
    if (correct) newStats.totalCorrect++;
    if (!newStats.byDate[todayKey]) newStats.byDate[todayKey] = { answered: 0, correct: 0 };
    newStats.byDate[todayKey].answered++;
    if (correct) newStats.byDate[todayKey].correct++;
    if (topicId !== '_exam') {
      if (!newStats.byTopic[topicId]) newStats.byTopic[topicId] = { answered: 0, correct: 0 };
      newStats.byTopic[topicId].answered++;
      if (correct) newStats.byTopic[topicId].correct++;
    }
    newStats.bestCombo = Math.max(newStats.bestCombo, newMaxCombo);
    saveJSON('stats', newStats);
    setStats(newStats);

    setQuizState({
      ...quizState,
      score: newScore,
      combo: newCombo,
      maxCombo: newMaxCombo,
      locked: true,
      answeredHistory: newHistory,
    });
  }

  function handleNext() {
    if (!quizState) return;
    const { qIdx, topic } = quizState;
    if (!topic) return;
    const nextIdx = qIdx + 1;
    if (nextIdx >= topic.questions.length) {
      const pct = Math.round(quizState.score / topic.questions.length * 100);

      // Update stats on completion
      const newStats = { ...stats };
      newStats.quizzesCompleted++;
      if (quizState.isExam && pct >= 50) newStats.examsPassed++;
      saveJSON('stats', newStats);
      setStats(newStats);

      // Update history
      const newHistory = { ...history };
      if (topic.id !== '_exam') {
        const topicHistory = newHistory[topic.id] || [];
        topicHistory.push({
          date: new Date().toISOString().slice(0, 10),
          score: quizState.score,
          total: topic.questions.length,
          pct,
        });
        newHistory[topic.id] = topicHistory;
        saveJSON('history', newHistory);
        setHistory(newHistory);
      }

      // Check achievements
      const topicIds = TOPICS.map(t => t.id);
      const newlyUnlocked = checkAndUnlockAchievements({
        pct,
        isExam: quizState.isExam,
        isMistakes: quizState.isMistakes,
        stats: newStats,
        achievements,
        topicIds,
      });
      if (newlyUnlocked.length > 0) {
        const newAchievements = [...achievements, ...newlyUnlocked];
        saveJSON('achievements', newAchievements);
        setAchievements(newAchievements);
        const toShow = newlyUnlocked
          .map(id => ACHIEVEMENTS_DATA.find(a => a.id === id))
          .filter((a): a is Achievement => !!a);
        setAchievementQueue(q => [...q, ...toShow]);
      }

      setResult({
        score: quizState.score,
        total: topic.questions.length,
        maxCombo: quizState.maxCombo,
        topic,
        isExam: quizState.isExam,
        isMistakes: quizState.isMistakes,
        answeredHistory: quizState.answeredHistory,
      });
      setScreen('result');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setQuizState({ ...quizState, qIdx: nextIdx, locked: false, removedByHint: [] });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleJump(idx: number) {
    if (!quizState || idx === quizState.qIdx) return;
    setQuizState({ ...quizState, qIdx: idx, locked: false, removedByHint: [] });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleHint() {
    if (!quizState || quizState.hintsLeft <= 0 || quizState.locked) return;
    const { topic, qIdx, order, removedByHint } = quizState;
    if (!topic) return;
    const realIdx = order[qIdx];
    const q = topic.questions[realIdx];
    const wrongs = q.a.map((_, i) => i).filter(i => i !== q.c && !removedByHint.includes(i));
    const toRemove = shuffleArray(wrongs).slice(0, 2);
    setQuizState({
      ...quizState,
      hintsLeft: quizState.hintsLeft - 1,
      removedByHint: [...removedByHint, ...toRemove],
    });
  }

  function handleTimeout() {
    if (!quizState || quizState.locked) return;
    handleAnswer(quizState.topic!.questions[quizState.order[quizState.qIdx]].c === -1 ? 0 : -1, false);
  }

  function handleBack() {
    setScreen('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleRetry() {
    if (!quizState) return;
    const { topicIdx, isExam, isMistakes } = quizState;
    if (isExam) { startExam(); return; }
    if (isMistakes && topicIdx >= 0) { startMistakes({ stopPropagation: () => {}, preventDefault: () => {} } as React.MouseEvent, topicIdx); return; }
    startQuiz(topicIdx);
  }

  function toggleShuffle(e: React.MouseEvent, topicId: string) {
    e.stopPropagation();
    const next = { ...shuffleByTopic, [topicId]: !shuffleByTopic[topicId] };
    setShuffleByTopic(next);
    saveJSON('shuffleByTopic', next);
  }

  function toggleTimer(e: React.MouseEvent, topicId: string) {
    e.stopPropagation();
    const next = { ...timerByTopic, [topicId]: !timerByTopic[topicId] };
    setTimerByTopic(next);
    saveJSON('timerByTopic', next);
  }

  return (
    <>
      <Toast message={toast} onClear={() => setToast('')} />
      <AchievementToast
        achievement={achievementToast}
        onDone={() => setAchievementToast(null)}
      />
      <WelcomeModal onDismiss={() => {}} />

      {screen === 'home' && (
        <div className="container">
          <div className="hero">
            <div className="brand-icon">
              <span style={{ fontFamily: 'Impact, sans-serif', fontSize: 22, color: '#fff', letterSpacing: 1 }}>IA</span>
            </div>
            <h1 className="title">Iron Academy</h1>
            <div className="subtitle">Тести для <span>тренера</span></div>
            <div className="tag-line">Анатомія · Біомеханіка · Психологія · Методика тренувань</div>
          </div>

          <div id="exam-block">
            <button className="exam-card" onClick={startExam}>
              <div className="exam-badge">Фінальний іспит</div>
              <div className="exam-icon">🏆</div>
              <div className="exam-title">Тренер чи ні?</div>
              <div className="exam-desc">25 випадкових питань з усіх тем. Перевір свої знання!</div>
              <div className="exam-cta">Почати іспит</div>
            </button>
          </div>

          <div className="top-actions">
            <button className="action-btn" onClick={() => setScreen('srs')}>
              <span className="ico">🧠</span>
              <span>SRS Повторення</span>
            </button>
            <button className="action-btn" onClick={() => setScreen('simulator')}>
              <span className="ico">📝</span>
              <span>Симулятор іспиту</span>
            </button>
            <button className="action-btn" onClick={() => setScreen('stats')}>
              <span className="ico">📊</span>
              <span>Кабінет</span>
            </button>
            <button className="action-btn" onClick={() => setScreen('achievements')}>
              <span className="ico">🏅</span>
              <span>Досягнення</span>
              {achievements.length > 0 && (
                <span className="action-pill">{achievements.length}</span>
              )}
            </button>
            <button className="action-btn" onClick={() => setScreen('glossary')}>
              <span className="ico">📖</span>
              <span>Глосарій</span>
            </button>
            <button className="action-btn" onClick={() => setScreen('anatomy')}>
              <span className="ico">🫀</span>
              <span>Анатомія</span>
            </button>
            <button className="action-btn" onClick={() => setScreen('match')}>
              <span className="ico">🎯</span>
              <span>Match-гра</span>
            </button>
            <button className="action-btn" onClick={() => setScreen('flashcards')}>
              <span className="ico">🃏</span>
              <span>Флеш-картки</span>
            </button>
          </div>

          <div className="section-label">Теми</div>

          <div className="topics">
            {TOPICS.map((t, i) => (
              <TopicCard
                key={t.id}
                topic={t}
                index={i}
                shuffle={!!shuffleByTopic[t.id]}
                timerOn={!!timerByTopic[t.id]}
                mistakesCount={(mistakes[t.id] || []).length}
                onStart={() => startQuiz(i)}
                onToggleShuffle={(e) => toggleShuffle(e, t.id)}
                onToggleTimer={(e) => toggleTimer(e, t.id)}
                onStartMistakes={(e) => startMistakes(e, i)}
              />
            ))}
          </div>

          <footer>
            <div className="copyright-main">© 2026 Iron Academy · Valiavskiy Oleksiy</div>
            <div className="copyright-sub">Created with <span className="heart">❤</span> & AI</div>
            <div className="contact-title">— Зв'язатися зі мною —</div>
            <div className="contact-block">
              <a className="contact-pill" href="https://t.me/emotionyx" target="_blank" rel="noopener">
                <span className="ico">✈️</span><span>Telegram · @emotionyx</span>
              </a>
              <a className="contact-pill insta" href="https://www.instagram.com/valiavskiy/" target="_blank" rel="noopener">
                <span className="ico">📷</span><span>Instagram · valiavskiy</span>
              </a>
            </div>
            <div className="contact-note">Питання, побажання, баги — пиши мені напряму 💬</div>
          </footer>
        </div>
      )}

      {screen === 'quiz' && quizState && (
        <>
          <ComboIndicator combo={quizState.combo} />
          <QuizScreen
            state={quizState}
            onAnswer={handleAnswer}
            onNext={handleNext}
            onBack={handleBack}
            onJump={handleJump}
            onUseHint={handleHint}
            onTimeout={handleTimeout}
            onToast={showToast}
          />
        </>
      )}

      {screen === 'result' && result && (
        <ResultScreen
          result={result}
          onRetry={handleRetry}
          onHome={handleBack}
          onToast={showToast}
        />
      )}

      {screen === 'stats' && (
        <StatsScreen stats={stats} streak={streak} onBack={handleBack} />
      )}

      {screen === 'achievements' && (
        <AchievementsScreen unlocked={achievements} onBack={handleBack} />
      )}

      {screen === 'glossary' && (
        <GlossaryScreen onBack={handleBack} />
      )}

      {screen === 'anatomy' && (
        <AnatomyScreen onBack={handleBack} />
      )}

      {screen === 'match' && (
        <MatchScreen onBack={handleBack} />
      )}

      {screen === 'flashcards' && (
        <FlashcardsScreen onBack={handleBack} />
      )}
    </>
  );
}
