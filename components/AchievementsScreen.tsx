'use client';
import { ACHIEVEMENTS_DATA } from '../data/achievements';

interface AchievementsScreenProps {
  unlocked: string[];
  onBack: () => void;
}

export default function AchievementsScreen({ unlocked, onBack }: AchievementsScreenProps) {
  return (
    <div className="quiz-screen active">
      <div className="container">
        <div className="quiz-header">
          <button className="back-btn" onClick={onBack}>← Назад</button>
          <div className="quiz-title">Досягнення</div>
          <div className="quiz-counter">
            <b>{unlocked.length}</b><span>/{ACHIEVEMENTS_DATA.length}</span>
          </div>
        </div>

        <div className="achv-grid">
          {ACHIEVEMENTS_DATA.map(a => {
            const isUnlocked = unlocked.includes(a.id);
            return (
              <div key={a.id} className={`achv-card ${isUnlocked ? 'unlocked' : 'locked'}`}>
                <div className="ico">{a.icon}</div>
                <div className="nm">{a.name}</div>
                <div className="dsc">{a.desc}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
