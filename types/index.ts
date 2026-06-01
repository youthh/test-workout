export interface Question {
  q: string;
  a: string[];
  c: number;
  e: string;
}

export interface Topic {
  id: string;
  icon: string;
  title: string;
  desc: string;
  questions: Question[];
}

export interface AnswerRecord {
  correct: boolean;
  chosen: number;
}

export interface QuizState {
  topic: Topic | null;
  topicIdx: number;
  qIdx: number;
  score: number;
  locked: boolean;
  order: number[];
  isExam: boolean;
  isMistakes: boolean;
  combo: number;
  maxCombo: number;
  hintsLeft: number;
  timerOn: boolean;
  removedByHint: number[];
  answeredHistory: (AnswerRecord | null)[];
  sources?: Array<{ topicId: string; qIdx: number }>;
  sourceIndices?: number[];
}

export type Screen = 'home' | 'quiz' | 'result';

export interface ResultData {
  score: number;
  total: number;
  maxCombo: number;
  topic: Topic;
  isExam: boolean;
  isMistakes: boolean;
  answeredHistory: (AnswerRecord | null)[];
}
