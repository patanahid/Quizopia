import { Progress } from "@/components/ui/progress";

interface QuizProgressProps {
  totalQuestions: number;
  attemptedQuestions: number;
  markedForReview: number;
}

export function QuizProgress({ totalQuestions, attemptedQuestions, markedForReview }: QuizProgressProps) {
  const progressPercentage = (attemptedQuestions / totalQuestions) * 100;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>Progress: {attemptedQuestions}/{totalQuestions} Questions</span>
        <span>Marked for Review: {markedForReview}</span>
      </div>
      <Progress value={progressPercentage} className="h-2" />
    </div>
  );
}
