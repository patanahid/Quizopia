import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QuizState } from "@/types/quiz";

interface ResumeQuizDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResume: () => void;
  onStartNew: () => void;
  quizState: QuizState;
  totalQuestions: number;
}

export function ResumeQuizDialog({
  open,
  onOpenChange,
  onResume,
  onStartNew,
  quizState,
  totalQuestions,
}: ResumeQuizDialogProps) {
  const attemptedCount = Object.keys(quizState?.answers || {}).length;
  const reviewCount = quizState?.markedForReview?.length || 0;

  if (!quizState || !attemptedCount) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resume Previous Attempt?</DialogTitle>
          <DialogDescription>
            You have a previous attempt with the following progress:
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <ul className="space-y-2 text-sm">
            <li>• Questions Attempted: {attemptedCount} of {totalQuestions}</li>
            <li>• Questions Marked for Review: {reviewCount}</li>
            <li>• Time Remaining: {Math.floor(quizState.timeRemaining / 60)} minutes</li>
          </ul>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onStartNew}>
            Start New Attempt
          </Button>
          <Button onClick={onResume}>
            Resume Previous Attempt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
