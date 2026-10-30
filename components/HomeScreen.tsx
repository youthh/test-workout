'use client';
import { TOPICS } from '../data/topics';
import { CATEGORIES } from '../data/categories';
import { plural } from '../lib/utils';
import TopicCard from './TopicCard';
import type { QuizState, Screen, TopicHistory } from '../types';
import type { Stats } from './StatsScreen';
import type { SavedSimulator } from './ExamSimulatorScreen';

interface HomeScreenProps {
  stats: Stats;
  history: TopicHistory;
  mistakes: Record<string, number[]>;
  achievementsCount: number;
  streak: number;
  theme: 'dark' | 'light';
  savedQuiz: QuizState | null;
  savedSimulator: SavedSimulator | null;
  shuffleByTopic: Record<string, boolean>;
  timerByTopic: Record<string, boolean>;
  onNavigate: (s: Screen) => void;
  onToggleTheme: () => void;
  onStartQuiz: (topicIdx: number) => void;
  onStartMistakes: (topicIdx: number) => void;
  onStartAllMistakes: () => void;
  onStartExam: () => void;
  onToggleShuffle: (topicId: string) => void;
  onToggleTimer: (topicId: string) => void;
  onResumeQuiz: () => void;
  onDiscardQuiz: () => void;
  onResumeSimulator: () => void;
  onDiscardSimulator: () => void;
}

const TOOLS: { screen: Screen; icon: string; label: string; short?: string }[] = [
  { screen: 'flashcards', icon: '🃏', label: 'Флеш-картки' },
  { screen: 'glossary', icon: '📖', label: 'Глосарій' },
  { screen: 'anatomy', icon: '🫀', label: 'Анатомія' },
  { screen: 'match', icon: '🧩', label: 'Матч-гра' },
  { screen: 'srs', icon: '🧠', label: 'SRS' },
  { screen: 'simulator', icon: '📝', label: 'Симулятор' },
  { screen: 'program', icon: '🏋️', label: 'Конструктор програми', short: 'Конструктор' },
  { screen: 'stats', icon: '📊', label: 'Кабінет' },
  { screen: 'achievements', icon: '🏅', label: 'Досягнення' },
];

export default function HomeScreen(p: HomeScreenProps) {
  const { stats, history, mistakes, streak, savedQuiz, savedSimulator } = p;
  const totalQ = TOPICS.reduce((s, t) => s + t.questions.length, 0);
  const answeredQ = stats.totalAnswered;
  const accuracy = answeredQ > 0 ? Math.round(stats.totalCorrect / answeredQ * 100) : 0;
  const topicsStarted = TOPICS.filter(t => history[t.id]?.length).length;
  const totalMistakes = Object.values(mistakes).reduce((s, a) => s + a.length, 0);
  const last = (id: string) => { const h = history[id]; return h?.length ? h[h.length - 1] : null; };
  const streakText = `${streak} ${plural(streak, 'день', 'дні', 'днів')} поспіль`;
  const savedTopic = savedQuiz?.topic;
  const savedIcon = savedTopic ? (TOPICS.find(t => t.id === savedTopic.id)?.icon ?? '📝') : '';

  return (
    <div className="home-shell">
      <nav className="home-topnav">
        <div className="hn-logo">
          <div className="hn-logo-icon" aria-hidden="true">IA</div>
          <span className="hn-logo-text">Iron Academy</span>
        </div>
        <div className="hn-spacer" />
        {streak > 0 && <div className="hn-streak">🔥 {streakText}</div>}
        <div className="hn-stats">
          {answeredQ > 0 && <span>Питань <b>{answeredQ}</b></span>}
          {accuracy > 0 && <span>Точність <b style={{ color: '#3ecf8e' }}>{accuracy}%</b></span>}
          <span>Тем <b>{topicsStarted}/{TOPICS.length}</b></span>
        </div>
        <button className="hn-theme" onClick={p.onToggleTheme} aria-label={p.theme === 'dark' ? 'Увімкнути світлу тему' : 'Увімкнути темну тему'}>
          {p.theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </nav>

      <aside className="home-sidebar">
        <div className="hs-section">Інструменти</div>
        <button className="hs-item hs-active" aria-current="page"><span className="hs-ico">🏠</span>Головна</button>
        {TOOLS.map(t => (
          <button key={t.screen} className="hs-item" onClick={() => p.onNavigate(t.screen)}>
            <span className="hs-ico">{t.icon}</span>{t.label}
            {t.screen === 'achievements' && p.achievementsCount > 0 && <span className="hs-badge">{p.achievementsCount}</span>}
          </button>
        ))}
        {totalMistakes > 0 && (
          <button className="hs-item" onClick={p.onStartAllMistakes}>
            <span className="hs-ico">🎯</span>Помилки
            <span className="hs-badge" style={{ background: '#ff7b00' }}>{totalMistakes}</span>
          </button>
        )}
        {CATEGORIES.map(cat => (
          <div key={cat.key}>
            <div className="hs-section" style={{ color: cat.color }}>{cat.label}</div>
            {TOPICS.filter(t => cat.ids.includes(t.id)).map(t => {
              const idx = TOPICS.indexOf(t);
              return (
                <button key={t.id} className="hs-topic" onClick={() => p.onStartQuiz(idx)}>
                  <span className="hs-tnum">{String(idx + 1).padStart(2, '0')}</span>
                  <span className="hs-tname">{t.title.replace('Біомеханіка: ', '')}</span>
                  <span className="hs-tbar"><span className="hs-tbar-fill" style={{ width: `${last(t.id)?.pct ?? 0}%`, background: cat.color }} /></span>
                </button>
              );
            })}
          </div>
        ))}
      </aside>

      <main className="home-main">
        {savedTopic && savedQuiz && (
          <div className="resume-banner">
            <div className="resume-info">
              <span className="resume-label">Незавершений тест</span>
              <span className="resume-title">{savedIcon} {savedTopic.title}</span>
              <span className="resume-sub">Питання {savedQuiz.qIdx + 1} з {savedTopic.questions.length}</span>
            </div>
            <div className="resume-actions">
              <button className="resume-discard" onClick={p.onDiscardQuiz}>Завершити</button>
              <button className="resume-cta-btn" onClick={p.onResumeQuiz}>Продовжити →</button>
            </div>
          </div>
        )}
        {savedSimulator && (
          <div className="resume-banner">
            <div className="resume-info">
              <span className="resume-label">Незавершений іспит</span>
              <span className="resume-title">📝 Симулятор іспиту</span>
              <span className="resume-sub">Питання {savedSimulator.currentIdx + 1} з {savedSimulator.questions.length}</span>
            </div>
            <div className="resume-actions">
              <button className="resume-discard" onClick={p.onDiscardSimulator}>Завершити</button>
              <button className="resume-cta-btn" onClick={p.onResumeSimulator}>Продовжити →</button>
            </div>
          </div>
        )}

        <div className="hm-hero-strip">
          <div className="hm-hero-left">
            <div className="hm-greeting">Привіт, тренере 👋</div>
            <h1 className="hm-hero-title">Продовжуй<br /><span>прокачуватись</span></h1>
            <div className="hm-hero-stats">
              <div className="hm-hstat"><div className="hm-hstat-val" style={{ color: '#ff7b00' }}>{answeredQ}</div><div className="hm-hstat-lbl">Питань</div></div>
              <div className="hm-hstat"><div className="hm-hstat-val" style={{ color: '#3ecf8e' }}>{accuracy > 0 ? `${accuracy}%` : '—'}</div><div className="hm-hstat-lbl">Точність</div></div>
              <div className="hm-hstat"><div className="hm-hstat-val" style={{ color: '#f59e0b' }}>{topicsStarted}/{TOPICS.length}</div><div className="hm-hstat-lbl">Тем</div></div>
              {totalMistakes > 0 && <div className="hm-hstat"><div className="hm-hstat-val" style={{ color: '#a78bfa' }}>{totalMistakes}</div><div className="hm-hstat-lbl">Помилок</div></div>}
            </div>
          </div>
          <div className="hm-hero-right">
            <button className="hm-exam-card" onClick={p.onStartExam}>
              <div className="hm-exam-sup">Фінальний іспит</div>
              <div className="hm-exam-title">Тренер чи ні?</div>
              <div className="hm-exam-desc">25 питань з усіх тем. Перевір знання!</div>
              <div className="hm-exam-btn">Почати іспит →</div>
            </button>
            {streak > 0 && (
              <div className="hm-streak">
                <span className="hm-streak-fire">🔥</span>
                <div>
                  <div className="hm-streak-days">{streakText}</div>
                  <div className="hm-streak-sub">Не переривай серію!</div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="hm-overall">
          <div className="hm-overall-left">
            <div className="hm-overall-label">Загальний прогрес по темах</div>
            <div className="hm-seg">
              {TOPICS.map(t => {
                const pct = last(t.id)?.pct ?? 0;
                const cat = CATEGORIES.find(c => c.ids.includes(t.id));
                return (
                  <div key={t.id} className="hm-seg-item" title={t.title} style={{ background: pct > 0 ? (cat?.color ?? '#333') : 'var(--border)', opacity: pct > 0 ? 0.3 + pct / 100 * 0.7 : 0.6 }} />
                );
              })}
            </div>
          </div>
          <div className="hm-overall-right">
            <div className="hm-overall-big"><b>{answeredQ}</b> / {totalQ}</div>
            <div className="hm-overall-sub">питань пройдено</div>
          </div>
        </div>

        <div className="hm-tools">
          {TOOLS.map(t => (
            <button key={t.screen} className="hm-tool" onClick={() => p.onNavigate(t.screen)}>
              <span aria-hidden="true">{t.icon}</span><span className="hm-tool-lbl">{t.short ?? t.label}</span>
              {t.screen === 'achievements' && p.achievementsCount > 0 && <span className="hm-tool-badge">{p.achievementsCount}</span>}
            </button>
          ))}
        </div>

        {CATEGORIES.map(cat => {
          const catTopics = TOPICS.filter(t => cat.ids.includes(t.id));
          const catQ = catTopics.reduce((s, t) => s + t.questions.length, 0);
          return (
            <section key={cat.key} className="hm-cat-block">
              <div className="hm-cat-header">
                <div className="hm-cat-dot" style={{ background: cat.color }} />
                <h2 className="hm-cat-name" style={{ color: cat.color }}>{cat.label}</h2>
                <div className="hm-cat-line" />
                <div className="hm-cat-count">{catTopics.length} {plural(catTopics.length, 'тема', 'теми', 'тем')} · {catQ} питань</div>
              </div>
              <div className="hm-topics-grid">
                {catTopics.map(t => {
                  const idx = TOPICS.indexOf(t);
                  const l = last(t.id);
                  return (
                    <TopicCard
                      key={t.id}
                      topic={t}
                      index={idx}
                      shuffle={!!p.shuffleByTopic[t.id]}
                      timerOn={!!p.timerByTopic[t.id]}
                      mistakesCount={(mistakes[t.id] || []).length}
                      lastPct={l?.pct ?? 0}
                      lastScore={l?.score ?? 0}
                      onStart={() => p.onStartQuiz(idx)}
                      onToggleShuffle={e => { e.stopPropagation(); p.onToggleShuffle(t.id); }}
                      onToggleTimer={e => { e.stopPropagation(); p.onToggleTimer(t.id); }}
                      onStartMistakes={e => { e.stopPropagation(); p.onStartMistakes(idx); }}
                    />
                  );
                })}
              </div>
            </section>
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
}
