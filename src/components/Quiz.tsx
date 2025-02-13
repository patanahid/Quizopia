import { useState, useEffect } from "react";
import { Quiz as QuizType, QuizState } from "@/types/quiz";
import { QuestionStatus } from "./QuestionStatus";
import Timer from "./Timer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, ArrowRight, BookmarkPlus } from "lucide-react";
import { toast } from "sonner";
import { QuizProgress } from "./QuizProgress";
import { Results } from "./Results";
import { ThemeToggle } from "./ThemeToggle";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import type { Components } from "react-markdown";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";

const markdownComponents: Components = {
  pre: ({ children }) => (
    <pre className="p-4 bg-muted rounded-lg overflow-x-auto">
      {children}
    </pre>
  ),
  code: ({ className, children, ...props }) => {
    const match = /language-(\w+)/.exec(className || "");
    const isInline = !match && !className;
    return (
      <code
        className={`${className} ${
          isInline ? "bg-muted px-1 py-0.5 rounded" : ""
        }`}
        {...props}
      >
        {children}
      </code>
    );
  },
};

interface QuizProps {
  quiz: QuizType;
  onComplete: (state: QuizState) => void;
  onStateUpdate?: (state: QuizState) => void;
  initialState?: QuizState;
}

export function Quiz({ quiz, onComplete, onStateUpdate, initialState }: QuizProps) {
  const navigate = useNavigate();
  const [showResults, setShowResults] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showResumeDialog, setShowResumeDialog] = useState(false);

  const [state, setState] = useState<QuizState>(() => {
    const savedQuiz = localStorage.getItem(`quiz-${quiz.id}-save`);
    if (savedQuiz) {
      return JSON.parse(savedQuiz);
    }
    return initialState || {
      currentQuestionIndex: 0,
      answers: {},
      markedForReview: [],
      timeRemaining: quiz.settings.timeLimit,
      isPaused: true,
      startTime: Date.now(),
      totalPausedTime: 0,
    };
  });

  useEffect(() => {
    const savedQuiz = localStorage.getItem(`quiz-${quiz.id}-save`);
    if (savedQuiz && !initialState) {
      setShowResumeDialog(true);
    }
  }, [quiz.id, initialState]);

  const handleStartNew = () => {
    localStorage.removeItem(`quiz-${quiz.id}-save`);
    setState({
      currentQuestionIndex: 0,
      answers: {},
      markedForReview: [],
      timeRemaining: quiz.settings.timeLimit,
      isPaused: true,
      startTime: Date.now(),
      totalPausedTime: 0,
    });
    setShowResumeDialog(false);
    toast.success("Starting fresh quiz attempt!");
  };

  const handleResume = () => {
    const savedQuiz = localStorage.getItem(`quiz-${quiz.id}-save`);
    if (savedQuiz) {
      const savedState = JSON.parse(savedQuiz);
      setState(savedState);
      toast.success("Quiz resumed from saved progress!");
    }
    setShowResumeDialog(false);
  };

  const currentQuestion = quiz.questions[state.currentQuestionIndex];

  const getQuestionStatus = (questionId: string) => {
    if (state.markedForReview.includes(questionId)) return "review";
    if (state.answers[questionId]) return "attempted";
    return "unattempted";
  };

  const handleMarkForReview = () => {
    setState((prev) => ({
      ...prev,
      markedForReview: prev.markedForReview.includes(currentQuestion.id)
        ? prev.markedForReview.filter((id) => id !== currentQuestion.id)
        : [...prev.markedForReview, currentQuestion.id],
    }));
    toast.success(state.markedForReview.includes(currentQuestion.id)
      ? "Question unmarked"
      : "Question marked for review");
  };

  const handleNavigate = (index: number) => {
    setState((prev) => ({
      ...prev,
      currentQuestionIndex: index,
    }));
  };

  const handleAnswer = (answer: string) => {
    setState((prev) => {
      const isFirstAnswer = Object.keys(prev.answers).length === 0;
      const now = Date.now();
      const newState = {
        ...prev,
        answers: {
          ...prev.answers,
          [currentQuestion.id]: prev.answers[currentQuestion.id] === answer ? "" : answer,
        },
      };

      if (isFirstAnswer && prev.isPaused) {
        newState.isPaused = false;
        newState.startTime = now;
        newState.totalPausedTime = 0;
        toast.success("Quiz Started");
      }

      return newState;
    });
  };

  const handlePauseToggle = () => {
    setState((prev) => {
      const now = Date.now();
      if (prev.isPaused) {
        return {
          ...prev,
          isPaused: false,
          startTime: now,
        };
      } else {
        return {
          ...prev,
          isPaused: true,
          totalPausedTime: prev.totalPausedTime + (now - prev.startTime),
        };
      }
    });

    toast.success(state.isPaused ? "Quiz resumed" : "Quiz paused");
  };

  const handleTimeUpdate = (newTime: number) => {
    setState((prev) => ({
      ...prev,
      timeRemaining: newTime,
    }));

    if (newTime <= 0) {
      handleTimeUp();
    }
  };

  const handleTimeUp = () => {
    const now = Date.now();
    const totalTime = now - state.startTime;
    const actualTimeTaken = Math.floor((totalTime - state.totalPausedTime) / 1000);

    setState((prev) => ({
      ...prev,
      isPaused: true,
      timeRemaining: 0,
    }));

    setShowResults(true);

    toast.success("Time's up!");
  };

  const handleComplete = () => {
    const now = Date.now();
    const totalTime = now - state.startTime;
    const actualTimeTaken = Math.floor((totalTime - state.totalPausedTime) / 1000);
    setShowResults(true);
  };

  const handleSubmit = () => {
    onComplete({
      ...state,
      timeRemaining: 0,
      isPaused: true,
    });
    setShowResults(false);
  };

  const handleRetry = () => {
    setState({
      currentQuestionIndex: 0,
      answers: {},
      markedForReview: [],
      timeRemaining: quiz.settings.timeLimit,
      isPaused: true,
      startTime: Date.now(),
      totalPausedTime: 0,
    });
    setShowResults(false);
  };

  const handleSaveQuiz = () => {
    localStorage.setItem(`quiz-${quiz.id}-save`, JSON.stringify(state));
    setShowSaveDialog(false);
    toast.success("Quiz progress saved! You can resume later.");
    navigate("/");
  };

  const handleClearSave = () => {
    localStorage.removeItem(`quiz-${quiz.id}-save`);
    setState({
      currentQuestionIndex: 0,
      answers: {},
      markedForReview: [],
      timeRemaining: quiz.settings.timeLimit,
      isPaused: true,
      startTime: Date.now(),
      totalPausedTime: 0,
    });
    setShowResumeDialog(false);
    toast.success("Saved progress cleared. Starting fresh!");
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0 || hours > 0) parts.push(`${minutes}m`);
    parts.push(`${remainingSeconds}s`);
    
    return parts.join(' ');
  };

  if (showResults) {
    return (
      <Results
        quiz={quiz}
        state={state}
        onRetry={handleRetry}
      />
    );
  }

  return (
    <>
      <div className="container mx-auto p-4 max-w-4xl animate-fade-in">
        <div className="flex flex-col gap-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">{quiz.title}</h1>
            <div className="flex items-center gap-4">
              <Timer
                initialTime={state.timeRemaining}
                isPaused={state.isPaused}
                onPauseToggle={handlePauseToggle}
                onTimeUp={handleTimeUp}
                onTick={handleTimeUpdate}
              />
              <div className="text-sm font-medium">
                Time Remaining: {formatTime(state.timeRemaining)}
              </div>
              <ThemeToggle />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSaveDialog(true)}
              >
                Save & Exit
              </Button>
            </div>
          </div>

          <QuizProgress
            totalQuestions={quiz.questions.length}
            attemptedQuestions={Object.keys(state.answers).length}
            markedForReview={state.markedForReview.length}
          />

          <div className="flex flex-wrap gap-2 p-4 bg-card rounded-lg shadow-sm">
            {quiz.questions.map((question, index) => (
              <QuestionStatus
                key={question.id}
                number={index + 1}
                status={getQuestionStatus(question.id)}
                isActive={index === state.currentQuestionIndex}
                onClick={() => handleNavigate(index)}
              />
            ))}
          </div>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">
                Question {state.currentQuestionIndex + 1} of {quiz.questions.length}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkForReview}
                className={state.markedForReview.includes(currentQuestion.id) ? "text-red-500" : ""}
              >
                <BookmarkPlus className="w-4 h-4 mr-2" />
                Mark for Review
              </Button>
            </div>

            <div className="space-y-6">
              <div className="prose dark:prose-invert max-w-none">
                <Markdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
                  components={markdownComponents}
                  className="prose dark:prose-invert max-w-none"
                >
                  {currentQuestion.text}
                </Markdown>
              </div>

              <div className="space-y-4">
                {currentQuestion.choices.map((choice) => (
                  <div
                    key={choice.id}
                    onClick={() => handleAnswer(choice.id)}
                    className={cn(
                      "flex items-start space-x-3 p-4 rounded-lg border cursor-pointer transition-colors",
                      {
                        "bg-primary/5 border-primary": state.answers[currentQuestion.id] === choice.id,
                        "hover:bg-muted": state.answers[currentQuestion.id] !== choice.id,
                      }
                    )}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleAnswer(choice.id);
                      }
                    }}
                  >
                    <div className={cn(
                      "w-4 h-4 mt-1 rounded-full border-2 flex-shrink-0",
                      state.answers[currentQuestion.id] === choice.id
                        ? "border-primary bg-primary"
                        : "border-muted-foreground"
                    )}>
                      {state.answers[currentQuestion.id] === choice.id && (
                        <div className="w-2 h-2 m-0.5 rounded-full bg-white" />
                      )}
                    </div>
                    <div className="prose dark:prose-invert flex-1 [&>p]:m-0">
                      <Markdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeRaw]}
                        components={markdownComponents}
                        className="prose dark:prose-invert"
                      >
                        {choice.text}
                      </Markdown>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => handleNavigate(state.currentQuestionIndex - 1)}
              disabled={state.currentQuestionIndex === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            {state.currentQuestionIndex === quiz.questions.length - 1 ? (
              <Button onClick={handleComplete}>Submit Quiz</Button>
            ) : (
              <Button
                onClick={() => handleNavigate(state.currentQuestionIndex + 1)}
                disabled={state.currentQuestionIndex === quiz.questions.length - 1}
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <AlertDialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save Quiz Progress?</AlertDialogTitle>
            <AlertDialogDescription>
              This will save your current progress and answers. You can resume the quiz later from where you left off.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveQuiz}>
              Save & Exit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog 
        open={showResumeDialog} 
        onOpenChange={setShowResumeDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resume Saved Quiz?</AlertDialogTitle>
            <AlertDialogDescription>
              You have a saved quiz in progress. Would you like to resume from where you left off?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={handleClearSave}
              className="sm:order-1"
            >
              Clear Save
            </Button>
            <Button
              variant="outline"
              onClick={handleStartNew}
              className="sm:order-2"
            >
              Start New
            </Button>
            <Button
              onClick={handleResume}
              className="sm:order-3"
            >
              Resume
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
