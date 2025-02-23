import { Quiz, QuizState } from "./quiz";

export interface QuizResult {
  id: string;
  quizId: string;
  quizTitle: string;
  quizSnapshot: Quiz;  // Store full quiz to preserve questions even if quiz is deleted
  state: QuizState;
  timestamp: number;
  score: {
    total: number;
    percentage: number;
    correct: number;
    incorrect: number;
    notAttempted: number;
    marksGained: number;
    marksDeducted: number;
  };
  timeTaken: number;
}
