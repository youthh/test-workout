'use client';
import { useEffect, useState } from 'react';

interface WelcomeModalProps {
  onDismiss: () => void;
}

export default function WelcomeModal({ onDismiss }: WelcomeModalProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const welcomed = localStorage.getItem('welcomed');
    if (!welcomed) setVisible(true);
  }, []);

  function dismiss() {
    localStorage.setItem('welcomed', '1');
    setVisible(false);
    onDismiss();
  }

  if (!visible) return null;

  return (
    <div className={`welcome-overlay show`} onClick={dismiss}>
      <div className="welcome-modal" onClick={e => e.stopPropagation()}>
        <div className="welcome-icon">🏋️</div>
        <div className="welcome-title">Вітаю в Iron Academy!</div>
        <div className="welcome-subtitle">
          Твій тренажер з анатомії, біомеханіки та психології тренувань. Тести, глосарій, анатомія та ще більше — все в одному місці.
        </div>
        <div className="welcome-actions">
          <button className="welcome-btn primary" onClick={dismiss}>
            Почати навчання
          </button>
          <button className="welcome-btn secondary" onClick={dismiss}>
            Пропустити
          </button>
        </div>
      </div>
    </div>
  );
}
