'use client';
import type { ResultData } from '../types';

interface ResultScreenProps {
  result: ResultData;
  onRetry: () => void;
  onHome: () => void;
  onToast: (msg: string) => void;
}

function getVerdict(pct: number) {
  if (pct >= 90) return { emoji: '🏆', title: 'Легенда!', sub: 'Ідеальний результат. Ти знаєш це досконало.' };
  if (pct >= 75) return { emoji: '💪', title: 'Відмінно!', sub: 'Чудовий результат. Трохи більше практики — і ти непереможний.' };
  if (pct >= 60) return { emoji: '👍', title: 'Добре', sub: 'Непоганий результат. Є куди рости — повтори матеріал.' };
  if (pct >= 40) return { emoji: '📚', title: 'Середньо', sub: 'Треба більше практики. Вивчи помилки і спробуй ще раз.' };
  return { emoji: '🔥', title: 'Тренуйся!', sub: 'Не здавайся. Кожна помилка — це урок. Повтори матеріал.' };
}

export default function ResultScreen({ result, onRetry, onHome, onToast }: ResultScreenProps) {
  const { score, total, maxCombo, topic, isExam } = result;
  const pct = Math.round(score / total * 100);
  const verdict = getVerdict(pct);

  function handleShare() {
    const text = `IRON ACADEMY | ${topic.title}\nРезультат: ${score}/${total} (${pct}%) ${verdict.emoji}\nМакс. комбо: ×${maxCombo}`;
    navigator.clipboard?.writeText(text)
      .then(() => onToast('Результат скопійовано ✓'))
      .catch(() => onToast('Не вдалося скопіювати'));
  }

  return (
    <div className="quiz-screen active">
      <div className="container">
        <div className="result-card">
          <div className="result-emoji">{verdict.emoji}</div>
          <div className="result-title">{verdict.title}</div>
          <div className="result-subtitle">{verdict.sub}</div>
          <div className="score-big">{pct}%</div>
          <div className="score-detail">
            {score} / {total} правильних
            {maxCombo > 1 && <> · макс. комбо ×{maxCombo}</>}
            {isExam && ' · Фінальний іспит'}
          </div>
          <div className="actions">
            <button className="btn-primary" onClick={onRetry}>Пройти ще раз</button>
            <button className="btn-secondary" onClick={onHome}>← До тем</button>
            <button className="btn-share" onClick={handleShare}>📤 Поділитися</button>
          </div>
        </div>
      </div>
    </div>
  );
}
