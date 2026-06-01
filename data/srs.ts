export interface SRSCard {
  topicId: string;
  qIdx: number;
  interval: number;
  repetitions: number;
  easeFactor: number;
  nextReview: string; // YYYY-MM-DD
  lastReview: string;
}

export type SRSRating = 1 | 3 | 5; // 1=forgot, 3=hard, 5=easy

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function sm2(card: SRSCard, rating: SRSRating): SRSCard {
  let { interval, repetitions, easeFactor } = card;

  if (rating < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * easeFactor);
    repetitions++;
  }

  easeFactor = Math.max(1.3, easeFactor + 0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02));

  const next = new Date();
  next.setDate(next.getDate() + interval);

  return {
    ...card,
    interval,
    repetitions,
    easeFactor,
    nextReview: next.toISOString().slice(0, 10),
    lastReview: todayStr(),
  };
}

export function cardKey(topicId: string, qIdx: number): string {
  return `${topicId}__${qIdx}`;
}

export function loadSRSCards(): Record<string, SRSCard> {
  try { return JSON.parse(localStorage.getItem('srs_cards') || '{}'); } catch { return {}; }
}

export function saveSRSCards(cards: Record<string, SRSCard>): void {
  try { localStorage.setItem('srs_cards', JSON.stringify(cards)); } catch {}
}

export function newCard(topicId: string, qIdx: number): SRSCard {
  return { topicId, qIdx, interval: 0, repetitions: 0, easeFactor: 2.5, nextReview: todayStr(), lastReview: '' };
}
