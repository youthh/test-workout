'use client';
import { useEffect, useRef } from 'react';
import type { Achievement } from '../data/achievements';

interface AchievementToastProps {
  achievement: Achievement | null;
  onDone: () => void;
}

export default function AchievementToast({ achievement, onDone }: AchievementToastProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!achievement || !ref.current) return;
    ref.current.classList.add('show');
    const t = setTimeout(() => {
      ref.current?.classList.remove('show');
      setTimeout(onDone, 400);
    }, 2800);
    return () => clearTimeout(t);
  }, [achievement, onDone]);

  if (!achievement) return null;

  return (
    <div ref={ref} className="achv-toast">
      <span className="ico">{achievement.icon}</span>
      <div>
        <div className="ttl">Досягнення!</div>
        <div className="nm">{achievement.name}</div>
      </div>
    </div>
  );
}
