'use client';
import type { ResultData } from '../types';

interface ResultScreenProps {
  result: ResultData;
  mistakesLeft: number;
  onRetry: () => void;
  onMistakes: () => void;
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

const LETTERS = ['A', 'B', 'C', 'D'];

export default function ResultScreen({ result, mistakesLeft, onRetry, onMistakes, onHome, onToast }: ResultScreenProps) {
  const { score, total, maxCombo, topic, isExam, answeredHistory, order } = result;
  const wrong = answeredHistory
    .map((h, pos) => ({ h, q: topic.questions[order[pos]] }))
    .filter(x => x.h && !x.h.correct);
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
          {mistakesLeft > 0 && (
            <button className="btn-secondary result-mistakes-btn" onClick={onMistakes}>
              🎯 Робота над помилками ({mistakesLeft})
            </button>
          )}
        </div>

        {wrong.length > 0 && (
          <details className="result-review">
            <summary>Розбір помилок ({wrong.length})</summary>
            <ol>
              {wrong.map(({ h, q }, i) => (
                <li key={i} className="rr-item">
                  <p className="rr-q">{q.q}</p>
                  {h!.chosen >= 0
                    ? <p className="rr-bad">Твоя відповідь: {LETTERS[h!.chosen]}. {q.a[h!.chosen]}</p>
                    : <p className="rr-bad">Час вийшов</p>}
                  <p className="rr-good">Правильно: {LETTERS[q.c]}. {q.a[q.c]}</p>
                  <p className="rr-e">{q.e}</p>
                </li>
              ))}
            </ol>
          </details>
        )}
      </div>
    </div>
  );
}
