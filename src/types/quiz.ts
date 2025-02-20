export type QuestionType = "MCQ" | "TRUE_FALSE" | "SHORT_ANSWER";

export interface Choice {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  choices?: Choice[];
  correctAnswer: string;
  explanation: string;
}

export interface QuizState {
  currentQuestionIndex: number;
  answers: Record<string, string>;
  markedForReview: string[];
  timeRemaining: number;
  isPaused: boolean;
  startTime: number;
  totalPausedTime: number;
  isComplete?: boolean;
}

export interface QuizSettings {
  timeLimit: number;
  shuffleQuestions: boolean;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  settings: QuizSettings;
}
