import { useState, useEffect } from "react";
import { Quiz as QuizType, QuizState } from "@/types/quiz";
import { QuestionStatus } from "./QuestionStatus";
import Timer from "./Timer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, ArrowRight, BookmarkPlus, Save } from "lucide-react";
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
import { CodeBlock } from "@/components/ui/code-block";
import { useSaveSystem } from "@/hooks/useSaveSystem";
import { SaveSlotDialog } from "./SaveSlotDialog";

const markdownComponents: Components = {
  pre: ({ children }) => (
    <CodeBlock 
      code={String(children)}
      language={children?.toString().match(/^```(\w+)/)?.[1] || undefined}
    />
  ),
  code: ({ node, className, children, ...props }) => {
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
  const [showLoadDialog, setShowLoadDialog] = useState(false);

  const { 
    saveSlots, 
    createSave, 
    deleteSave, 
    loadSave, 
    setupAutosave,
    clearAllSaves
  } = useSaveSystem({ 
    quizId: quiz.id,
    autoSaveInterval: 30000, // 30 seconds
    maxManualSlots: 3
  });

  const [state, setState] = useState<QuizState>(() => {
    if (initialState) return initialState;

    const freshState = {
      currentQuestionIndex: 0,
      answers: {},
      markedForReview: [],
      timeRemaining: quiz.settings.timeLimit,
      isPaused: true,
      startTime: Date.now(),
      totalPausedTime: 0,
      isComplete: false
    };

    // Check for existing saves
    if (saveSlots.length > 0) {
      setShowLoadDialog(true);
      return freshState;
    }

    // No saves found, create initial autosave
    createSave(freshState, "Initial Save", true);
    return freshState;
  });

  // Handle start quiz
  const handleStartQuiz = () => {
    setState(prev => ({
      ...prev,
      isPaused: false
    }));
    toast.info("Quiz started. Progress will be automatically saved.", {
      duration: 3000
    });
  };

  // Setup autosave when the quiz starts
  useEffect(() => {
    if (!state.isPaused && !state.isComplete) {
      const cleanup = setupAutosave(state);
      return () => cleanup();
    }
  }, [state.isPaused, state.isComplete, setupAutosave, state]);

  // Update parent component on state changes
  useEffect(() => {
    if (onStateUpdate) {
      onStateUpdate(state);
    }
  }, [state, onStateUpdate]);

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
      const newState = {
        ...prev,
        answers: {
          ...prev.answers,
          [currentQuestion.id]: prev.answers[currentQuestion.id] === answer ? "" : answer,
        },
      };

      // Start quiz on first answer if not started
      if (isFirstAnswer && prev.isPaused) {
        newState.isPaused = false;
      }

      return newState;
    });
  };

  const handlePauseToggle = () => {
    setState(prev => ({
      ...prev,
      isPaused: !prev.isPaused
    }));
    toast.success(state.isPaused ? "Quiz resumed" : "Quiz paused");
  };

  const handleTimeUpdate = (newTime: number) => {
    setState(prev => ({
      ...prev,
      timeRemaining: newTime
    }));
  };

  const handleTimeUp = () => {
    setState(prev => ({
      ...prev,
      isComplete: true,
      isPaused: true,
      timeRemaining: 0
    }));
    setShowResults(true);
    toast.warning("Time's up!");
  };

  const handleComplete = () => {
    setShowResults(true);
  };

  const handleSubmit = () => {
    onComplete({
      ...state,
      timeRemaining: 0,
      isPaused: true,
      isComplete: true
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
      isComplete: false
    });
    setShowResults(false);
  };

  const handleSaveQuiz = (name: string) => {
    createSave(state, name);
    setShowSaveDialog(false);
    toast.success("Quiz progress saved!");
  };

  const handleLoadSave = (id: string) => {
    const loadedState = loadSave(id);
    if (loadedState) {
      setState(loadedState);
      setShowLoadDialog(false);
      toast.success("Save loaded successfully!");
    }
  };

  const handleDeleteSave = (id: string) => {
    deleteSave(id);
    toast.success("Save deleted!");
  };

  const handleClearAllSaves = () => {
    clearAllSaves();
    // Reset to fresh state
    const freshState = {
      currentQuestionIndex: 0,
      answers: {},
      markedForReview: [],
      timeRemaining: quiz.settings.timeLimit,
      isPaused: true,
      startTime: Date.now(),
      totalPausedTime: 0,
      isComplete: false
    };
    setState(freshState);
    setShowSaveDialog(false);
    toast.info("Quiz reset. Autosave will begin when you start the quiz.", {
      duration: 4000
    });
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

  const currentQuestion = quiz.questions[state.currentQuestionIndex];

  // Handle start fresh quiz
  const handleStartFresh = () => {
    const freshState = {
      currentQuestionIndex: 0,
      answers: {},
      markedForReview: [],
      timeRemaining: quiz.settings.timeLimit,
      isPaused: true,
      startTime: Date.now(),
      totalPausedTime: 0,
      isComplete: false
    };
    setState(freshState);
    setShowLoadDialog(false);
    toast.success("Quiz ready to start!");
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
                <Save className="w-4 h-4 mr-2" />
                Save Quiz
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
                      "flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors",
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
              <Button onClick={handleComplete}>
                Complete Quiz
              </Button>
            ) : (
              <Button
                variant="outline"
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

      <SaveSlotDialog 
        open={showSaveDialog}
        onOpenChange={setShowSaveDialog}
        saveSlots={saveSlots}
        onSave={(name) => {
          createSave(state, name);
          setShowSaveDialog(false);
        }}
        onLoad={(id) => {
          const loadedState = loadSave(id);
          if (loadedState) {
            setState(loadedState);
            setShowSaveDialog(false);
          }
        }}
        onDelete={deleteSave}
        onClearAll={handleClearAllSaves}
      />

      <AlertDialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resume Previous Session?</AlertDialogTitle>
            <AlertDialogDescription>
              A previous quiz session was found. Would you like to resume from where you left off?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleStartFresh}>
              Start Fresh
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              const autosave = saveSlots.find(slot => slot.isAutosave);
              if (autosave) {
                const loadedState = loadSave(autosave.id);
                if (loadedState) {
                  setState(loadedState);
                  setShowLoadDialog(false);
                  toast.success("Save loaded successfully!");
                }
              }
            }}>
              Resume
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
