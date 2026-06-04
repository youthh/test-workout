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
import ExamSimulatorScreen, { type SavedSimulator } from '../components/ExamSimulatorScreen';
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
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [savedQuiz, setSavedQuiz] = useState<QuizState | null>(null);
  const [savedSimulator, setSavedSimulator] = useState<SavedSimulator | null>(null);

  useEffect(() => {
    setShuffleByTopic(loadJSON('shuffleByTopic', {}));
    setTimerByTopic(loadJSON('timerByTopic', {}));
    setMistakes(loadJSON('mistakes', {}));
    setStats(loadJSON('stats', DEFAULT_STATS));
    setHistory(loadJSON('history', {}));
    setAchievements(loadJSON('achievements', []));
    setStreak(loadJSON('streak', 0));
    const saved = (localStorage.getItem('theme') as 'dark' | 'light') || 'dark';
    setTheme(saved);
    document.documentElement.setAttribute('data-theme', saved);
    setSavedQuiz(loadJSON('savedQuiz', null));
    setSavedSimulator(loadJSON('savedSimulator', null));
  }, []);

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('theme', next);
    document.documentElement.setAttribute('data-theme', next);
  }

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
      const unanswered = quizState.answeredHistory.filter(h => h === null).length;
      if (unanswered > 0) {
        const firstIdx = quizState.answeredHistory.findIndex(h => h === null);
        showToast(`Залишилось ${unanswered} ${unanswered === 1 ? 'питання' : 'питань'} без відповіді`);
        setQuizState({ ...quizState, qIdx: firstIdx, locked: false, removedByHint: [] });
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
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
    if (screen === 'quiz' && quizState) {
      saveJSON('savedQuiz', quizState);
      setSavedQuiz(quizState);
    }
    setScreen('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resumeQuiz() {
    if (!savedQuiz) return;
    setQuizState(savedQuiz);
    setScreen('quiz');
    saveJSON('savedQuiz', null);
    setSavedQuiz(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function discardQuiz() {
    saveJSON('savedQuiz', null);
    setSavedQuiz(null);
  }

  function resumeSimulator() {
    if (!savedSimulator) return;
    setScreen('simulator');
    saveJSON('savedSimulator', null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function discardSimulator() {
    saveJSON('savedSimulator', null);
    setSavedSimulator(null);
  }

  function handleSaveSimulator(s: SavedSimulator) {
    saveJSON('savedSimulator', s);
    setSavedSimulator(s);
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

      {screen === 'home' && (() => {
        const CATS = [
          { key: 'anatomy',   label: 'Анатомія',    color: '#ff7b00', ids: ['osteology','myology','muscle-functions'] },
          { key: 'bio',       label: 'Біомеханіка', color: '#4a9eff', ids: ['planes','spine','arms','legs','chest','shoulders','back','core'] },
          { key: 'method',    label: 'Методика',    color: '#3ecf8e', ids: ['movement-patterns','pyramid','training-programming'] },
          { key: 'other',     label: 'Інше',        color: '#a78bfa', ids: ['psych','nutrition'] },
        ];
        const totalQ = TOPICS.reduce((s, t) => s + t.questions.length, 0);
        const answeredQ = stats.totalAnswered;
        const accuracy = answeredQ > 0 ? Math.round(stats.totalCorrect / answeredQ * 100) : 0;
        const topicsStarted = TOPICS.filter(t => history[t.id]?.length).length;
        const totalMistakes = Object.values(mistakes).reduce((s, a) => s + a.length, 0);
        const getTopicPct = (id: string) => { const h = history[id]; return h?.length ? h[h.length - 1].pct : 0; };
        const getTopicScore = (id: string) => { const h = history[id]; return h?.length ? h[h.length - 1].score : 0; };

        return (
          <div className="home-shell">
            {/* ── TOP NAV ── */}
            <nav className="home-topnav">
              <div className="hn-logo">
                <div className="hn-logo-icon">IA</div>
                <span className="hn-logo-text">Iron Academy</span>
              </div>
              <div className="hn-spacer" />
              {streak > 0 && <div className="hn-streak">🔥 {streak} {streak === 1 ? 'день' : streak < 5 ? 'дні' : 'днів'} поспіль</div>}
              <div className="hn-stats">
                {answeredQ > 0 && <span>Питань <b>{answeredQ}</b></span>}
                {accuracy > 0 && <span>Точність <b style={{color:'#3ecf8e'}}>{accuracy}%</b></span>}
                <span>Тем <b>{topicsStarted}/{TOPICS.length}</b></span>
              </div>
              <button className="hn-theme" onClick={toggleTheme}>{theme === 'dark' ? '☀️' : '🌙'}</button>
            </nav>

            {/* ── SIDEBAR ── */}
            <aside className="home-sidebar">
              <div className="hs-section">Інструменти</div>
              <button className="hs-item hs-active"><span className="hs-ico">🏠</span>Головна</button>
              <button className="hs-item" onClick={() => setScreen('flashcards')}><span className="hs-ico">🃏</span>Флеш-картки</button>
              <button className="hs-item" onClick={() => setScreen('glossary')}><span className="hs-ico">📖</span>Глосарій</button>
              <button className="hs-item" onClick={() => setScreen('anatomy')}><span className="hs-ico">🫀</span>Анатомія</button>
              <button className="hs-item" onClick={() => setScreen('achievements')}>
                <span className="hs-ico">🏅</span>Досягнення
                {achievements.length > 0 && <span className="hs-badge">{achievements.length}</span>}
              </button>
              <button className="hs-item" onClick={() => setScreen('stats')}><span className="hs-ico">📊</span>Кабінет</button>
              <button className="hs-item" onClick={() => setScreen('match')}><span className="hs-ico">🎯</span>Матч-гра</button>
              <button className="hs-item" onClick={() => setScreen('srs')}><span className="hs-ico">🧠</span>SRS</button>
              <button className="hs-item" onClick={() => setScreen('simulator')}><span className="hs-ico">📝</span>Симулятор</button>
              {totalMistakes > 0 && (
                <button className="hs-item" onClick={() => { const i = TOPICS.findIndex(t => (mistakes[t.id]||[]).length > 0); if (i>=0) startMistakes({ stopPropagation:()=>{}, preventDefault:()=>{} } as React.MouseEvent, i); }}>
                  <span className="hs-ico">🎯</span>Помилки
                  <span className="hs-badge" style={{background:'#ff7b00'}}>{totalMistakes}</span>
                </button>
              )}
              {CATS.map(cat => {
                const catTopics = TOPICS.filter(t => cat.ids.includes(t.id));
                return (
                  <div key={cat.key}>
                    <div className="hs-section" style={{color: cat.color}}>{cat.label}</div>
                    {catTopics.map(t => {
                      const pct = getTopicPct(t.id);
                      return (
                        <button key={t.id} className="hs-topic" onClick={() => startQuiz(TOPICS.indexOf(t))}>
                          <span className="hs-tnum">{String(TOPICS.indexOf(t)+1).padStart(2,'0')}</span>
                          <span className="hs-tname">{t.title.replace('Біомеханіка: ','')}</span>
                          <span className="hs-tbar"><span className="hs-tbar-fill" style={{width:`${pct}%`, background: cat.color}} /></span>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </aside>

            {/* ── MAIN ── */}
            <main className="home-main">

              {/* resume banners */}
              {savedQuiz?.topic && (
                <div className="resume-banner">
                  <div className="resume-info">
                    <span className="resume-label">Незавершений тест</span>
                    <span className="resume-title" dangerouslySetInnerHTML={{__html: savedQuiz.topic.icon + ' ' + savedQuiz.topic.title}} />
                    <span className="resume-sub">Питання {savedQuiz.qIdx + 1} з {savedQuiz.topic.questions.length}</span>
                  </div>
                  <div className="resume-actions">
                    <button className="resume-discard" onClick={discardQuiz}>Завершити</button>
                    <button className="resume-cta-btn" onClick={resumeQuiz}>Продовжити →</button>
                  </div>
                </div>
              )}
              {savedSimulator && (
                <div className="resume-banner">
                  <div className="resume-info">
                    <span className="resume-label">Незавершений іспит</span>
                    <span className="resume-title">📝 Симулятор іспиту</span>
                    <span className="resume-sub">Питання {savedSimulator.currentIdx+1} з {savedSimulator.questions.length}</span>
                  </div>
                  <div className="resume-actions">
                    <button className="resume-discard" onClick={discardSimulator}>Завершити</button>
                    <button className="resume-cta-btn" onClick={resumeSimulator}>Продовжити →</button>
                  </div>
                </div>
              )}

              {/* hero strip */}
              <div className="hm-hero-strip">
                <div className="hm-hero-left">
                  <div className="hm-greeting">Привіт, тренере 👋</div>
                  <h1 className="hm-hero-title">Продовжуй<br /><span>прокачуватись</span></h1>
                  <div className="hm-hero-stats">
                    <div className="hm-hstat"><div className="hm-hstat-val" style={{color:'#ff7b00'}}>{answeredQ}</div><div className="hm-hstat-lbl">Питань</div></div>
                    <div className="hm-hstat"><div className="hm-hstat-val" style={{color:'#3ecf8e'}}>{accuracy > 0 ? `${accuracy}%` : '—'}</div><div className="hm-hstat-lbl">Точність</div></div>
                    <div className="hm-hstat"><div className="hm-hstat-val" style={{color:'#f59e0b'}}>{topicsStarted}/{TOPICS.length}</div><div className="hm-hstat-lbl">Тем</div></div>
                    {totalMistakes > 0 && <div className="hm-hstat"><div className="hm-hstat-val" style={{color:'#a78bfa'}}>{totalMistakes}</div><div className="hm-hstat-lbl">Помилок</div></div>}
                  </div>
                </div>
                <div className="hm-hero-right">
                  <button className="hm-exam-card" onClick={startExam}>
                    <div className="hm-exam-sup">Фінальний іспит</div>
                    <div className="hm-exam-title">Тренер чи ні?</div>
                    <div className="hm-exam-desc">25 питань з усіх тем. Перевір знання!</div>
                    <div className="hm-exam-btn">Почати іспит →</div>
                  </button>
                  {streak > 0 && (
                    <div className="hm-streak">
                      <span className="hm-streak-fire">🔥</span>
                      <div>
                        <div className="hm-streak-days">{streak} {streak === 1 ? 'день' : streak < 5 ? 'дні' : 'днів'} поспіль</div>
                        <div className="hm-streak-sub">Не переривай серію!</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* overall progress */}
              <div className="hm-overall">
                <div className="hm-overall-left">
                  <div className="hm-overall-label">Загальний прогрес по темах</div>
                  <div className="hm-seg">
                    {TOPICS.map(t => {
                      const pct = getTopicPct(t.id);
                      const cat = CATS.find(c => c.ids.includes(t.id));
                      return (
                        <div key={t.id} className="hm-seg-item" style={{background: pct > 0 ? (cat?.color ?? '#333') : '#1a1a1a', opacity: pct > 0 ? 0.3 + pct/100*0.7 : 0.15}} />
                      );
                    })}
                  </div>
                </div>
                <div className="hm-overall-right">
                  <div className="hm-overall-big"><b>{answeredQ}</b> / {totalQ}</div>
                  <div className="hm-overall-sub">питань пройдено</div>
                </div>
              </div>

              {/* tools */}
              <div className="hm-tools">
                <button className="hm-tool" onClick={() => setScreen('flashcards')}><span>🃏</span><span className="hm-tool-lbl">Флеш-картки</span></button>
                <button className="hm-tool" onClick={() => setScreen('glossary')}><span>📖</span><span className="hm-tool-lbl">Глосарій</span></button>
                <button className="hm-tool" onClick={() => setScreen('anatomy')}><span>🫀</span><span className="hm-tool-lbl">Анатомія</span></button>
                <button className="hm-tool" onClick={() => setScreen('match')}><span>🧩</span><span className="hm-tool-lbl">Матч-гра</span></button>
                <button className="hm-tool" onClick={() => setScreen('srs')}><span>🧠</span><span className="hm-tool-lbl">SRS</span></button>
                <button className="hm-tool" onClick={() => setScreen('simulator')}><span>📝</span><span className="hm-tool-lbl">Симулятор</span></button>
                <button className="hm-tool" onClick={() => setScreen('stats')}><span>📊</span><span className="hm-tool-lbl">Кабінет</span></button>
                <button className="hm-tool" onClick={() => setScreen('achievements')}>
                  <span>🏅</span><span className="hm-tool-lbl">Досягнення</span>
                  {achievements.length > 0 && <span className="hm-tool-badge">{achievements.length}</span>}
                </button>
              </div>

              {/* topics by category */}
              {CATS.map(cat => {
                const catTopics = TOPICS.filter(t => cat.ids.includes(t.id));
                const catQ = catTopics.reduce((s, t) => s + t.questions.length, 0);
                return (
                  <div key={cat.key} className="hm-cat-block">
                    <div className="hm-cat-header">
                      <div className="hm-cat-dot" style={{background: cat.color}} />
                      <div className="hm-cat-name" style={{color: cat.color}}>{cat.label}</div>
                      <div className="hm-cat-line" />
                      <div className="hm-cat-count">{catTopics.length} {catTopics.length === 1 ? 'тема' : catTopics.length < 5 ? 'теми' : 'тем'} · {catQ} питань</div>
                    </div>
                    <div className="hm-topics-grid">
                      {catTopics.map(t => {
                        const idx = TOPICS.indexOf(t);
                        const pct = getTopicPct(t.id);
                        const score = getTopicScore(t.id);
                        return (
                          <TopicCard
                            key={t.id}
                            topic={t}
                            index={idx}
                            shuffle={!!shuffleByTopic[t.id]}
                            timerOn={!!timerByTopic[t.id]}
                            mistakesCount={(mistakes[t.id] || []).length}
                            lastPct={pct}
                            lastScore={score}
                            onStart={() => startQuiz(idx)}
                            onToggleShuffle={(e) => toggleShuffle(e, t.id)}
                            onToggleTimer={(e) => toggleTimer(e, t.id)}
                            onStartMistakes={(e) => startMistakes(e, idx)}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              <footer>
                <div className="copyright-main">© 2026 Iron Academy · Valiavskiy Oleksiy</div>
                <div className="copyright-sub">Created with <span className="heart">❤</span> & AI</div>
                <div className="contact-block">
                  <a className="contact-pill" href="https://t.me/emotionyx" target="_blank" rel="noopener"><span className="ico">✈️</span><span>Telegram · @emotionyx</span></a>
                  <a className="contact-pill insta" href="https://www.instagram.com/valiavskiy/" target="_blank" rel="noopener"><span className="ico">📷</span><span>Instagram · valiavskiy</span></a>
                </div>
              </footer>
            </main>
          </div>
        );
      })()}

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

      {screen === 'srs' && (
        <SRSScreen onBack={handleBack} />
      )}

      {screen === 'simulator' && (
        <ExamSimulatorScreen
          onBack={handleBack}
          onToast={showToast}
          savedState={savedSimulator ?? undefined}
          onSaveState={handleSaveSimulator}
        />
      )}
    </>
  );
}
