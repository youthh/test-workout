'use client';
import { useState } from 'react';
import { MUSCLES } from '../data/muscles';
import type { Muscle } from '../data/muscles';

interface AnatomyScreenProps {
  onBack: () => void;
}

const BODY_PATH = 'M100,15 C112,15 122,25 122,38 C122,48 117,58 110,62 L115,72 L138,82 L168,150 L155,165 L142,150 L138,140 L132,150 L130,200 L130,310 L128,360 L132,375 L120,385 L115,370 L112,310 L105,240 L100,240 L95,240 L88,310 L85,370 L80,385 L68,375 L72,360 L70,310 L70,200 L68,150 L62,140 L58,150 L45,165 L32,150 L62,82 L85,72 L90,62 C83,58 78,48 78,38 C78,25 88,15 100,15 Z';

function MuscleShape({ muscle, selected, onClick }: { muscle: Muscle; selected: boolean; onClick: () => void }) {
  const cls = `anat-muscle${selected ? ' selected' : ''}`;
  if (muscle.shape === 'ellipse') {
    return (
      <ellipse
        className={cls}
        cx={muscle.cx}
        cy={muscle.cy}
        rx={muscle.rx}
        ry={muscle.ry}
        onClick={onClick}
      />
    );
  }
  if (muscle.shape === 'rect') {
    return (
      <rect
        className={cls}
        x={muscle.x}
        y={muscle.y}
        width={muscle.w}
        height={muscle.h}
        rx={muscle.rx2 ?? 0}
        onClick={onClick}
      />
    );
  }
  if (muscle.shape === 'polygon') {
    return (
      <polygon
        className={cls}
        points={muscle.points}
        onClick={onClick}
      />
    );
  }
  return null;
}

export default function AnatomyScreen({ onBack }: AnatomyScreenProps) {
  const [view, setView] = useState<'front' | 'back'>('front');
  const [selected, setSelected] = useState<Muscle | null>(null);

  const muscles = MUSCLES.filter(m => m.view === view);

  function selectMuscle(id: string) {
    const m = MUSCLES.find(x => x.id === id) ?? null;
    setSelected(prev => prev?.id === id ? null : m);
  }

  return (
    <div className="quiz-screen active">
      <div className="container">
        <div className="quiz-header">
          <button className="back-btn" onClick={onBack}>← Назад</button>
          <div className="quiz-title">Анатомія</div>
          <div />
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <button
            className={`action-btn${view === 'front' ? ' active' : ''}`}
            onClick={() => { setView('front'); setSelected(null); }}
            style={view === 'front' ? { borderColor: 'var(--accent)' } : {}}
          >
            <span className="ico">👁️</span>
            <span>Передня</span>
          </button>
          <button
            className={`action-btn${view === 'back' ? ' active' : ''}`}
            onClick={() => { setView('back'); setSelected(null); }}
            style={view === 'back' ? { borderColor: 'var(--accent)' } : {}}
          >
            <span className="ico">🔄</span>
            <span>Задня</span>
          </button>
        </div>

        <div className="anat-svg-wrap">
          <div className="anat-svg-title">{view === 'front' ? 'Передня поверхня' : 'Задня поверхня'}</div>
          <svg
            className="anat-svg"
            viewBox="0 0 200 400"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d={BODY_PATH} fill="#1a1a1a" stroke="#3a3a3a" strokeWidth="1.5" />
            {muscles.map(m => (
              <MuscleShape
                key={m.id}
                muscle={m}
                selected={selected?.id === m.id}
                onClick={() => selectMuscle(m.id)}
              />
            ))}
          </svg>
        </div>

        <div className="anat-info">
          {selected ? (
            <>
              <div className="name">{selected.name}</div>
              <div className="desc">{selected.desc}</div>
            </>
          ) : (
            <div className="placeholder">Натисни на мʼяз, щоб побачити інформацію</div>
          )}
        </div>
      </div>
    </div>
  );
}
