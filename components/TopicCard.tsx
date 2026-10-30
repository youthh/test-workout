'use client';
import { categoryOf } from '../data/categories';

interface TopicCardProps {
  topic: { id: string; icon: string; title: string; desc: string; questions: unknown[] };
  index: number;
  shuffle: boolean;
  timerOn: boolean;
  mistakesCount: number;
  lastPct: number;
  lastScore: number;
  onStart: () => void;
  onToggleShuffle: (e: React.MouseEvent) => void;
  onToggleTimer: (e: React.MouseEvent) => void;
  onStartMistakes: (e: React.MouseEvent) => void;
}

export default function TopicCard({
  topic, index, shuffle, timerOn, mistakesCount,
  lastPct, lastScore,
  onStart, onToggleShuffle, onToggleTimer, onStartMistakes,
}: TopicCardProps) {
  const cat = categoryOf(topic.id);
  const total = topic.questions.length;
  const hasProgress = lastPct > 0;

  return (
    <div
      className="topic-card-v3"
      style={{ '--cat-color': cat.color } as React.CSSProperties}
      onClick={onStart}
    >
      {/* watermark emoji */}
      <span className="tc3-bg-icon" aria-hidden="true">{topic.icon}</span>

      {/* category */}
      <div className="tc3-cat">{cat.label}</div>

      {/* number */}
      <div className="tc3-num">— {String(index + 1).padStart(2, '0')} —</div>

      {/* title */}
      <h3 className="tc3-title">{topic.title}</h3>

      {/* desc */}
      <p className="tc3-desc">{topic.desc}</p>

      {/* toggles */}
      <button type="button" className={`card-shuffle${shuffle ? ' on' : ''}`} onClick={onToggleShuffle} aria-pressed={shuffle}>
        <span className="left"><span className="icon" aria-hidden="true">🔀</span><span>Перемішати</span></span>
        <span className="mini-toggle" aria-hidden="true" />
      </button>
      <button type="button" className={`card-shuffle${timerOn ? ' on' : ''}`} onClick={onToggleTimer} aria-pressed={timerOn}>
        <span className="left"><span className="icon" aria-hidden="true">⏱️</span><span>Таймер 30 сек</span></span>
        <span className="mini-toggle" aria-hidden="true" />
      </button>

      {mistakesCount > 0 && (
        <button className="card-mistakes" onClick={onStartMistakes}>
          <span className="left"><span>🎯</span><span>Робота над помилками</span></span>
          <span className="count">{mistakesCount}</span>
        </button>
      )}

      {/* progress bar */}
      <div className="tc3-progress">
        <div className="tc3-progress-bg">
          <div className="tc3-progress-bar" style={{ width: `${lastPct}%` }} />
        </div>
      </div>

      {/* footer */}
      <div className="tc3-footer">
        <span>{hasProgress ? `${lastScore} / ${total} питань` : `${total} питань`}</span>
        <button type="button" className="tc3-go" onClick={e => { e.stopPropagation(); onStart(); }}>
          {hasProgress ? 'Пройти знову' : 'Почати тест'}
        </button>
      </div>
    </div>
  );
}
