'use client';

interface DayData {
  date: string;
  answered: number;
  correct: number;
}

interface ProgressChartProps {
  byDate: Record<string, { answered: number; correct: number }>;
  days?: number;
}

function getLast(n: number): string[] {
  const result: string[] = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    result.push(d.toISOString().slice(0, 10));
  }
  return result;
}

function fmtLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function ProgressChart({ byDate, days = 14 }: ProgressChartProps) {
  const dates = getLast(days);
  const data: DayData[] = dates.map(date => ({
    date,
    answered: byDate[date]?.answered ?? 0,
    correct: byDate[date]?.correct ?? 0,
  }));

  const { maxAnswered, totalAnswered, totalCorrect, activeDays } = data.reduce(
    (acc, d) => ({
      maxAnswered: Math.max(acc.maxAnswered, d.answered),
      totalAnswered: acc.totalAnswered + d.answered,
      totalCorrect: acc.totalCorrect + d.correct,
      activeDays: acc.activeDays + (d.answered > 0 ? 1 : 0),
    }),
    { maxAnswered: 5, totalAnswered: 0, totalCorrect: 0, activeDays: 0 }
  );
  const avgAccuracy = totalAnswered > 0 ? Math.round(totalCorrect / totalAnswered * 100) : 0;

  // SVG dimensions
  const W = 420;
  const H = 150;
  const PAD_L = 28;
  const PAD_R = 8;
  const PAD_T = 10;
  const PAD_B = 28;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;

  const barGap = chartW / days;
  const barW = barGap * 0.6;
  const barOffset = (barGap - barW) / 2;

  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  const sparkPoints = data.flatMap((d, i) => {
    if (d.answered === 0) return [];
    const x = PAD_L + i * barGap + barGap / 2;
    const y = PAD_T + chartH - (d.correct / d.answered) * chartH;
    return [`${x},${y}`];
  });

  if (totalAnswered === 0) {
    return (
      <div className="progress-chart-empty">
        <div style={{ fontSize: 32, marginBottom: 8 }}>📈</div>
        <div style={{ color: 'var(--text-mute)', fontSize: 14 }}>
          Пройди перший тест — тут з'явиться твій прогрес
        </div>
      </div>
    );
  }

  return (
    <div className="progress-chart-wrap">
      <div className="progress-chart-meta">
        <div className="pcm-item">
          <span className="pcm-val">{totalAnswered}</span>
          <span className="pcm-label">відповідей за {days}д</span>
        </div>
        <div className="pcm-item">
          <span className="pcm-val good">{avgAccuracy}%</span>
          <span className="pcm-label">середня точність</span>
        </div>
        <div className="pcm-item">
          <span className="pcm-val orange">{activeDays}</span>
          <span className="pcm-label">активних днів</span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        style={{ display: 'block', overflow: 'visible' }}
        aria-label="Графік активності за останні 14 днів"
      >
        {/* Grid lines */}
        {gridLines.map(f => {
          const y = PAD_T + chartH * (1 - f);
          const label = f === 0 ? '0' : f === 1 ? String(maxAnswered) : '';
          return (
            <g key={f}>
              <line
                x1={PAD_L} y1={y} x2={W - PAD_R} y2={y}
                stroke="var(--border)" strokeWidth={f === 0 ? 1.5 : 0.5} strokeDasharray={f === 0 ? '' : '3 3'}
              />
              {label && (
                <text x={PAD_L - 4} y={y + 4} textAnchor="end" fontSize={9} fill="var(--text-mute)">
                  {label}
                </text>
              )}
            </g>
          );
        })}

        {/* Bars */}
        {data.map((d, i) => {
          const x = PAD_L + i * barGap + barOffset;
          const totalH = (d.answered / maxAnswered) * chartH;
          const correctH = (d.correct / maxAnswered) * chartH;
          const baseY = PAD_T + chartH;

          return (
            <g key={d.date}>
              {/* answered (background bar) */}
              {d.answered > 0 && (
                <rect
                  x={x} y={baseY - totalH}
                  width={barW} height={totalH}
                  rx={2}
                  fill="var(--card-bg)"
                  stroke="var(--border)"
                  strokeWidth={0.5}
                />
              )}
              {/* correct (green fill) */}
              {d.correct > 0 && (
                <rect
                  x={x} y={baseY - correctH}
                  width={barW} height={correctH}
                  rx={2}
                  fill="var(--green)"
                  opacity={0.85}
                />
              )}
              {/* Day label — show every other to avoid clutter */}
              {i % 2 === 0 && (
                <text
                  x={x + barW / 2} y={H - 4}
                  textAnchor="middle" fontSize={8.5}
                  fill={d.answered > 0 ? 'var(--text-sec)' : 'var(--text-mute)'}
                >
                  {fmtLabel(d.date)}
                </text>
              )}
            </g>
          );
        })}

        {/* Accuracy sparkline */}
        {sparkPoints.length > 1 && (
          <polyline
            points={sparkPoints.join(' ')}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={1.5}
            strokeLinejoin="round"
            strokeLinecap="round"
            opacity={0.7}
          />
        )}
        {data.map((d, i) => {
          if (d.answered === 0) return null;
          const cx = PAD_L + i * barGap + barGap / 2;
          const acc = d.correct / d.answered;
          const cy = PAD_T + chartH - acc * chartH;
          return (
            <circle key={d.date} cx={cx} cy={cy} r={2.5} fill="var(--accent)">
              <title>{fmtLabel(d.date)}: {d.correct}/{d.answered} ({Math.round(acc * 100)}%)</title>
            </circle>
          );
        })}
      </svg>

      <div className="progress-chart-legend">
        <span><span className="leg-dot green" />Правильні відповіді</span>
        <span><span className="leg-dot accent" />Точність (лінія)</span>
      </div>
    </div>
  );
}
