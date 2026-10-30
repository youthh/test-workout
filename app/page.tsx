'use client';
import { useState, useCallback, useEffect, useRef } from 'react';
import { TOPICS } from '../data/topics';
import { ACHIEVEMENTS_DATA } from '../data/achievements';
import type { QuizState, ResultData, Topic, AnswerRecord, Screen, TopicHistory } from '../types';
import HomeScreen from '../components/HomeScreen';
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
import ExamSimulatorScreen, { type SavedSimulator } from '../components/ExamSimulatorScreen';
import ProgramBuilderScreen from '../components/program/ProgramBuilderScreen';
import type { Achievement } from '../data/achievements';
import { shuffleArray, dateKey, computeStreak, loadJSON, saveJSON } from '../lib/utils';

const INITIAL_HINTS = 3;

const DEFAULT_STATS: Stats = {
  totalAnswered: 0,
  totalCorrect: 0,
  byTopic: {},
  byDate: {},
  bestCombo: 0,
  quizzesCompleted: 0,
  examsPassed: 0,
};

type Tally = { answered: number; correct: number };
const bump = (t: Tally | undefined, correct: boolean): Tally => ({
  answered: (t?.answered ?? 0) + 1,
  correct: (t?.correct ?? 0) + (correct ? 1 : 0),
});

function newQuiz(topic: Topic, topicIdx: number, order: number[], extra: Partial<QuizState> = {}): QuizState {
  return {
    topic, topicIdx, qIdx: 0, score: 0, locked: false, order,
    isExam: false, isMistakes: false, combo: 0, maxCombo: 0,
    hintsLeft: INITIAL_HINTS, timerOn: false,
    removedByHint: [], answeredHistory: Array(topic.questions.length).fill(null),
    ...extra,
  };
}

function checkAndUnlockAchievements(ctx: {
  pct: number;
  isExam: boolean;
  isMistakes: boolean;
  stats: Stats;
  achievements: string[];
}): string[] {
  const hour = new Date().getHours();
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
    all_topics: TOPICS.every(t => (ctx.stats.byTopic[t.id]?.answered ?? 0) > 0),
    night_owl: hour < 6,
    early_bird: hour >= 5 && hour < 8,
  };
  return Object.entries(checks)
    .filter(([id, ok]) => ok && !ctx.achievements.includes(id))
    .map(([id]) => id);
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
  const [history, setHistory] = useState<TopicHistory>({});
  const [achievements, setAchievements] = useState<string[]>([]);
  const [achievementToast, setAchievementToast] = useState<Achievement | null>(null);
  const [achievementQueue, setAchievementQueue] = useState<Achievement[]>([]);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [savedQuiz, setSavedQuiz] = useState<QuizState | null>(null);
  const [savedSimulator, setSavedSimulator] = useState<SavedSimulator | null>(null);
  const streak = computeStreak(stats.byDate);

  useEffect(() => {
    setShuffleByTopic(loadJSON('shuffleByTopic', {}));
    setTimerByTopic(loadJSON('timerByTopic', {}));
    setMistakes(loadJSON('mistakes', {}));
    setStats(loadJSON('stats', DEFAULT_STATS));
    setHistory(loadJSON('history', {}));
    setAchievements(loadJSON('achievements', []));
    setTheme(document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark');
    setSavedQuiz(loadJSON('savedQuiz', null));
    setSavedSimulator(loadJSON('savedSimulator', null));
  }, []);

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    try { localStorage.setItem('theme', next); } catch {}
    document.documentElement.setAttribute('data-theme', next);
  }

  useEffect(() => {
    if (achievementQueue.length > 0 && !achievementToast) {
      const [next, ...rest] = achievementQueue;
      setAchievementToast(next);
      setAchievementQueue(rest);
    }
  }, [achievementQueue, achievementToast]);

  const showToast = useCallback((msg: string) => setToast(msg), []);
  const clearToast = useCallback(() => setToast(''), []);

  function goHome() {
    if (screen === 'quiz' && quizState) {
      saveJSON('savedQuiz', quizState);
      setSavedQuiz(quizState);
    }
    setScreen('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const goHomeRef = useRef(goHome);
  goHomeRef.current = goHome;

  useEffect(() => {
    const clean = () => window.history.replaceState(null, '', location.pathname + location.search);
    if (location.hash) clean();
    const onPop = () => {
      goHomeRef.current();
      if (window.history.state?.ia) clean();
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  function navigate(next: Screen) {
    const entry = { ia: next };
    if (screen === 'home') window.history.pushState(entry, '', `#${next}`);
    else window.history.replaceState(entry, '', `#${next}`);
    setScreen(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleBack() {
    if (window.history.state?.ia) window.history.back();
    else goHome();
  }

  function startQuiz(topicIdx: number) {
    const topic = TOPICS[topicIdx];
    const indices = topic.questions.map((_, i) => i);
    setQuizState(newQuiz(topic, topicIdx, shuffleByTopic[topic.id] ? shuffleArray(indices) : indices, {
      timerOn: !!timerByTopic[topic.id],
    }));
    navigate('quiz');
  }

  function startMistakes(topicIdx: number) {
    const base = TOPICS[topicIdx];
    const ids = mistakes[base.id] ?? [];
    if (!ids.length) { showToast('Немає помилок — нічого повторювати'); return; }
    const topic: Topic = { ...base, title: `${base.title} — помилки`, questions: ids.map(i => base.questions[i]) };
    setQuizState(newQuiz(topic, topicIdx, shuffleArray(ids.map((_, i) => i)), { isMistakes: true, sourceIndices: ids }));
    navigate('quiz');
  }

  function startAllMistakes() {
    const sources = TOPICS.flatMap(t => (mistakes[t.id] ?? []).map(qIdx => ({ topicId: t.id, qIdx })));
    if (!sources.length) { showToast('Немає помилок — нічого повторювати'); return; }
    const questions = sources.map(s => TOPICS.find(t => t.id === s.topicId)!.questions[s.qIdx]);
    const topic: Topic = { id: '_mistakes', icon: '🎯', title: 'Робота над помилками', desc: '', questions };
    setQuizState(newQuiz(topic, -1, shuffleArray(questions.map((_, i) => i)), { isMistakes: true, sources }));
    navigate('quiz');
  }

  function startExam() {
    const pool = TOPICS.flatMap(t => t.questions.map((q, qIdx) => ({ q, topicId: t.id, qIdx })));
    const sampled = shuffleArray(pool).slice(0, 25);
    const topic: Topic = { id: '_exam', icon: '🏆', title: 'Тренер чи ні?', desc: '', questions: sampled.map(s => s.q) };
    setQuizState(newQuiz(topic, -1, sampled.map((_, i) => i), {
      isExam: true,
      sources: sampled.map(s => ({ topicId: s.topicId, qIdx: s.qIdx })),
    }));
    navigate('quiz');
  }

  function handleAnswer(chosenIdx: number, correct: boolean) {
    if (!quizState?.topic) return;
    const { topic, qIdx, order, sources, sourceIndices } = quizState;
    const realIdx = order[qIdx];
    const src = sources?.[realIdx];
    const topicId = src ? src.topicId : topic.id;
    const actualQIdx = src ? src.qIdx : sourceIndices ? sourceIndices[realIdx] : realIdx;

    const cur = mistakes[topicId] ?? [];
    const has = cur.includes(actualQIdx);
    if (correct === has) {
      const newMistakes = { ...mistakes, [topicId]: correct ? cur.filter(i => i !== actualQIdx) : [...cur, actualQIdx] };
      saveJSON('mistakes', newMistakes);
      setMistakes(newMistakes);
    }

    const newCombo = correct ? quizState.combo + 1 : 0;
    const newMaxCombo = Math.max(quizState.maxCombo, newCombo);
    const today = dateKey();
    const newStats: Stats = {
      ...stats,
      totalAnswered: stats.totalAnswered + 1,
      totalCorrect: stats.totalCorrect + (correct ? 1 : 0),
      byDate: { ...stats.byDate, [today]: bump(stats.byDate[today], correct) },
      byTopic: { ...stats.byTopic, [topicId]: bump(stats.byTopic[topicId], correct) },
      bestCombo: Math.max(stats.bestCombo, newMaxCombo),
    };
    saveJSON('stats', newStats);
    setStats(newStats);

    const answeredHistory = [...quizState.answeredHistory];
    answeredHistory[qIdx] = { correct, chosen: chosenIdx } satisfies AnswerRecord;
    setQuizState({
      ...quizState,
      score: quizState.score + (correct ? 1 : 0),
      combo: newCombo,
      maxCombo: newMaxCombo,
      locked: true,
      answeredHistory,
    });
  }

  function finishQuiz(qs: QuizState, topic: Topic) {
    const total = topic.questions.length;
    const pct = Math.round(qs.score / total * 100);

    const newStats: Stats = {
      ...stats,
      quizzesCompleted: stats.quizzesCompleted + 1,
      examsPassed: stats.examsPassed + (qs.isExam && pct >= 50 ? 1 : 0),
    };
    saveJSON('stats', newStats);
    setStats(newStats);

    const isRealTopic = TOPICS.some(t => t.id === topic.id);
    if (isRealTopic && !qs.isMistakes) {
      const entry = { date: dateKey(), score: qs.score, total, pct };
      const newHistory = { ...history, [topic.id]: [...(history[topic.id] ?? []), entry] };
      saveJSON('history', newHistory);
      setHistory(newHistory);
    }

    const unlocked = checkAndUnlockAchievements({ pct, isExam: qs.isExam, isMistakes: qs.isMistakes, stats: newStats, achievements });
    if (unlocked.length) {
      const all = [...achievements, ...unlocked];
      saveJSON('achievements', all);
      setAchievements(all);
      setAchievementQueue(q => [...q, ...unlocked
        .map(id => ACHIEVEMENTS_DATA.find(a => a.id === id))
        .filter((a): a is Achievement => !!a)]);
    }

    setResult({
      score: qs.score,
      total,
      maxCombo: qs.maxCombo,
      topic,
      isExam: qs.isExam,
      isMistakes: qs.isMistakes,
      answeredHistory: qs.answeredHistory,
      order: qs.order,
    });
    navigate('result');
  }

  function handleNext() {
    if (!quizState?.topic) return;
    const { qIdx, topic, answeredHistory } = quizState;
    if (qIdx + 1 < topic.questions.length) {
      setQuizState({ ...quizState, qIdx: qIdx + 1, locked: false, removedByHint: [] });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const firstOpen = answeredHistory.findIndex(h => h === null);
    if (firstOpen >= 0) {
      const left = answeredHistory.filter(h => h === null).length;
      showToast(`Залишилось ${left} ${left === 1 ? 'питання' : 'питань'} без відповіді`);
      setQuizState({ ...quizState, qIdx: firstOpen, locked: false, removedByHint: [] });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    finishQuiz(quizState, topic);
  }

  function handleJump(idx: number) {
    if (!quizState || idx === quizState.qIdx) return;
    setQuizState({ ...quizState, qIdx: idx, locked: false, removedByHint: [] });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleHint() {
    if (!quizState?.topic || quizState.hintsLeft <= 0 || quizState.locked) return;
    const { topic, qIdx, order, removedByHint } = quizState;
    const q = topic.questions[order[qIdx]];
    const wrongs = q.a.map((_, i) => i).filter(i => i !== q.c && !removedByHint.includes(i));
    setQuizState({
      ...quizState,
      hintsLeft: quizState.hintsLeft - 1,
      removedByHint: [...removedByHint, ...shuffleArray(wrongs).slice(0, 2)],
    });
  }

  function handleTimeout() {
    if (!quizState || quizState.locked) return;
    handleAnswer(-1, false);
  }

  function resumeQuiz() {
    if (!savedQuiz) return;
    setQuizState(savedQuiz);
    saveJSON('savedQuiz', null);
    setSavedQuiz(null);
    navigate('quiz');
  }

  function discardQuiz() {
    saveJSON('savedQuiz', null);
    setSavedQuiz(null);
  }

  function discardSimulator() {
    saveJSON('savedSimulator', null);
    setSavedSimulator(null);
  }

  const handleSaveSimulator = useCallback((s: SavedSimulator | null) => {
    saveJSON('savedSimulator', s);
    setSavedSimulator(s);
  }, []);

  function handleRetry() {
    if (!quizState) return;
    const { topicIdx, isExam, isMistakes } = quizState;
    if (isExam) startExam();
    else if (isMistakes && topicIdx < 0) startAllMistakes();
    else if (isMistakes) startMistakes(topicIdx);
    else startQuiz(topicIdx);
  }

  function toggleIn(map: Record<string, boolean>, set: (m: Record<string, boolean>) => void, key: string, id: string) {
    const next = { ...map, [id]: !map[id] };
    set(next);
    saveJSON(key, next);
  }

  return (
    <>
      <Toast message={toast} onClear={clearToast} />
      <AchievementToast achievement={achievementToast} onDone={() => setAchievementToast(null)} />
      <WelcomeModal />

      {screen === 'home' && (
        <HomeScreen
          stats={stats}
          history={history}
          mistakes={mistakes}
          achievementsCount={achievements.length}
          streak={streak}
          theme={theme}
          savedQuiz={savedQuiz}
          savedSimulator={savedSimulator}
          shuffleByTopic={shuffleByTopic}
          timerByTopic={timerByTopic}
          onNavigate={navigate}
          onToggleTheme={toggleTheme}
          onStartQuiz={startQuiz}
          onStartMistakes={startMistakes}
          onStartAllMistakes={startAllMistakes}
          onStartExam={startExam}
          onToggleShuffle={id => toggleIn(shuffleByTopic, setShuffleByTopic, 'shuffleByTopic', id)}
          onToggleTimer={id => toggleIn(timerByTopic, setTimerByTopic, 'timerByTopic', id)}
          onResumeQuiz={resumeQuiz}
          onDiscardQuiz={discardQuiz}
          onResumeSimulator={() => navigate('simulator')}
          onDiscardSimulator={discardSimulator}
        />
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
          mistakesLeft={Object.values(mistakes).reduce((s, a) => s + a.length, 0)}
          onRetry={handleRetry}
          onMistakes={startAllMistakes}
          onHome={handleBack}
          onToast={showToast}
        />
      )}

      {screen === 'stats' && <StatsScreen stats={stats} streak={streak} onBack={handleBack} />}
      {screen === 'achievements' && <AchievementsScreen unlocked={achievements} onBack={handleBack} />}
      {screen === 'glossary' && <GlossaryScreen onBack={handleBack} />}
      {screen === 'anatomy' && <AnatomyScreen onBack={handleBack} />}
      {screen === 'match' && <MatchScreen onBack={handleBack} />}
      {screen === 'flashcards' && <FlashcardsScreen onBack={handleBack} />}
      {screen === 'srs' && <SRSScreen onBack={handleBack} />}
      {screen === 'simulator' && (
        <ExamSimulatorScreen
          onBack={handleBack}
          onToast={showToast}
          savedState={savedSimulator ?? undefined}
          onSaveState={handleSaveSimulator}
        />
      )}
      {screen === 'program' && <ProgramBuilderScreen onBack={handleBack} onToast={showToast} />}
    </>
  );
}
