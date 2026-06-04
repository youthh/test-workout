'use client';

const CATEGORIES: Record<string, { label: string; color: string }> = {
  'muscle-functions': { label: 'Анатомія',    color: '#ff7b00' },
  'osteology':        { label: 'Анатомія',    color: '#ff7b00' },
  'myology':          { label: 'Анатомія',    color: '#ff7b00' },
  'planes':           { label: 'Біомеханіка', color: '#4a9eff' },
  'spine':            { label: 'Біомеханіка', color: '#4a9eff' },
  'arms':             { label: 'Біомеханіка', color: '#4a9eff' },
  'legs':             { label: 'Біомеханіка', color: '#4a9eff' },
  'pyramid':          { label: 'Методика',    color: '#3ecf8e' },
  'psych':            { label: 'Психологія',  color: '#a78bfa' },
  'chest':            { label: 'Біомеханіка', color: '#4a9eff' },
  'shoulders':        { label: 'Біомеханіка', color: '#4a9eff' },
  'back':             { label: 'Біомеханіка', color: '#4a9eff' },
  'core':             { label: 'Біомеханіка', color: '#4a9eff' },
  'movement-patterns':    { label: 'Методика',    color: '#3ecf8e' },
  'training-programming': { label: 'Методика',    color: '#3ecf8e' },
  'nutrition':            { label: 'Харчування',  color: '#f472b6' },
};

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
  const cat = CATEGORIES[topic.id] ?? { label: 'Загальне', color: '#ff7b00' };
  const total = topic.questions.length;
  const hasProgress = lastPct > 0;

  return (
    <div
      className="topic-card-v3"
      style={{ '--cat-color': cat.color } as React.CSSProperties}
      onClick={onStart}
    >
      {/* watermark emoji */}
      <span
        className="tc3-bg-icon"
        dangerouslySetInnerHTML={{ __html: topic.icon }}
      />

      {/* category */}
      <div className="tc3-cat">{cat.label}</div>

      {/* number */}
      <div className="tc3-num">— {String(index + 1).padStart(2, '0')} —</div>

      {/* title */}
      <h3 className="tc3-title">{topic.title}</h3>

      {/* desc */}
      <p className="tc3-desc">{topic.desc}</p>

      {/* toggles */}
      <div className={`card-shuffle${shuffle ? ' on' : ''}`} onClick={onToggleShuffle}>
        <span className="left"><span className="icon">🔀</span><span>Перемішати</span></span>
        <span className="mini-toggle" />
      </div>
      <div className={`card-shuffle${timerOn ? ' on' : ''}`} onClick={onToggleTimer}>
        <span className="left"><span className="icon">⏱️</span><span>Таймер 30 сек</span></span>
        <span className="mini-toggle" />
      </div>

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
        <span className="tc3-go">{hasProgress ? 'Продовжити →' : 'Почати →'}</span>
      </div>
    </div>
  );
}
