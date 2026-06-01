'use client';
import { useEffect, useRef } from 'react';

interface ComboIndicatorProps {
  combo: number;
}

export default function ComboIndicator({ combo }: ComboIndicatorProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    if (combo >= 3) {
      ref.current.classList.add('show');
      ref.current.classList.remove('flash');
      void ref.current.offsetWidth;
      ref.current.classList.add('flash');
    } else {
      ref.current.classList.remove('show', 'flash');
    }
  }, [combo]);

  return (
    <div ref={ref} className="combo-indicator">
      🔥 COMBO ×{combo}
    </div>
  );
}
