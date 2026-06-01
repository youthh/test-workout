'use client';
import { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  onClear: () => void;
}

export default function Toast({ message, onClear }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!message) return;
    setVisible(true);
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(onClear, 300);
    }, 2200);
    return () => clearTimeout(t);
  }, [message, onClear]);

  if (!message) return null;

  return (
    <div className={`toast${visible ? ' show' : ''}`}>{message}</div>
  );
}
