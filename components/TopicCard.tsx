'use client';

interface TopicCardProps {
  topic: { id: string; icon: string; title: string; desc: string; questions: unknown[] };
  index: number;
  shuffle: boolean;
  timerOn: boolean;
  mistakesCount: number;
  onStart: () => void;
  onToggleShuffle: (e: React.MouseEvent) => void;
  onToggleTimer: (e: React.MouseEvent) => void;
  onStartMistakes: (e: React.MouseEvent) => void;
}

export default function TopicCard({
  topic, index, shuffle, timerOn, mistakesCount,
  onStart, onToggleShuffle, onToggleTimer, onStartMistakes,
}: TopicCardProps) {
  return (
    <div className="topic-card" onClick={onStart}>
      <div className="topic-head">
        <span className="topic-num">{String(index + 1).padStart(2, '0')}</span>
        <span
          className="topic-icon"
          dangerouslySetInnerHTML={{ __html: topic.icon }}
        />
      </div>
      <h3>{topic.title}</h3>
      <p>{topic.desc}</p>

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

      <div className="topic-meta">
        <span>{topic.questions.length} питань</span>
        <span className="start-btn">Почати &rarr;</span>
      </div>
    </div>
  );
}
