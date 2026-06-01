'use client';
import { TOPICS } from '../data/topics';
import ProgressChart from './ProgressChart';

export interface Stats {
  totalAnswered: number;
  totalCorrect: number;
  byTopic: Record<string, { answered: number; correct: number }>;
  byDate: Record<string, { answered: number; correct: number }>;
  bestCombo: number;
  quizzesCompleted: number;
  examsPassed: number;
}

interface StatsScreenProps {
  stats: Stats;
  streak: number;
  onBack: () => void;
}

function buildHeatmapDays(): string[] {
  const days: string[] = [];
  const today = new Date();
  for (let i = 83; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

function heatLevel(count: number): string {
  if (count === 0) return '';
  if (count < 5) return 'l1';
  if (count < 15) return 'l2';
  if (count < 30) return 'l3';
  return 'l4';
}

export default function StatsScreen({ stats, streak, onBack }: StatsScreenProps) {
  const accuracy = stats.totalAnswered > 0
    ? Math.round(stats.totalCorrect / stats.totalAnswered * 100)
    : 0;

  const days = buildHeatmapDays();

  return (
    <div className="quiz-screen active">
      <div className="container">
        <div className="quiz-header">
          <button className="back-btn" onClick={onBack}>← Назад</button>
          <div className="quiz-title">Статистика</div>
          <div />
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Відповіді</div>
            <div className="stat-val">{stats.totalAnswered}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Точність</div>
            <div className={`stat-val ${accuracy >= 70 ? 'good' : accuracy >= 50 ? 'orange' : 'accent'}`}>{accuracy}%</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Стрик</div>
            <div className="stat-val orange">{streak}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Макс. комбо</div>
            <div className="stat-val accent">×{stats.bestCombo}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Тести</div>
            <div className="stat-val">{stats.quizzesCompleted}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Іспитів</div>
            <div className="stat-val good">{stats.examsPassed}</div>
          </div>
        </div>

        <div className="section-label">Прогрес (14 днів)</div>
        <ProgressChart byDate={stats.byDate} days={14} />

        <div className="section-label">Активність (12 тижнів)</div>
        <div className="heatmap-wrap">
          <div className="heatmap">
            {days.map(day => {
              const count = stats.byDate[day]?.answered ?? 0;
              return (
                <div
                  key={day}
                  className={`heat-cell ${heatLevel(count)}`}
                  title={`${day}: ${count} відповідей`}
                />
              );
            })}
          </div>
          <div className="heat-legend">
            <span>Менше</span>
            <div className="scale">
              <div className="heat-cell" />
              <div className="heat-cell l1" />
              <div className="heat-cell l2" />
              <div className="heat-cell l3" />
              <div className="heat-cell l4" />
            </div>
            <span>Більше</span>
          </div>
        </div>

        <div className="section-label">По темах</div>
        <div className="topic-stats-list">
          {TOPICS.map(t => {
            const ts = stats.byTopic[t.id];
            const ans = ts?.answered ?? 0;
            const cor = ts?.correct ?? 0;
            const pct = ans > 0 ? Math.round(cor / ans * 100) : 0;
            return (
              <div key={t.id} className="topic-stat-row">
                <div className="top">
                  <span className="name">{t.icon} {t.title}</span>
                  <span className="vals">{cor}/{ans} · {pct}%</span>
                </div>
                <div className="bar">
                  <div className="bar-fill" style={{ width: pct + '%' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
