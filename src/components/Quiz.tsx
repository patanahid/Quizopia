import { useState, useEffect } from "react";
import type { Quiz, QuizState } from "@/types/quiz";
import { QuestionStatus } from "./QuestionStatus";
import Timer from "./Timer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, ArrowRight, BookmarkPlus, Save, Clock } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { QuizProgress } from "./QuizProgress";
import { Results } from "./Results";
import { ThemeToggle } from "./ThemeToggle";
import { useQuizResults } from "@/hooks/useQuizResults";
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
  quiz: Quiz;
  onComplete: (state: QuizState) => void;
  onStateUpdate?: (state: QuizState) => void;
  initialState?: QuizState;
}

export function Quiz({ quiz, onComplete, onStateUpdate, initialState }: QuizProps) {
  const navigate = useNavigate();
  const [showResults, setShowResults] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const { saveResult } = useQuizResults();
  const {
    saveSlots,
    createSave,
    deleteSave,
    loadSave,
    setupAutosave,
    clearAllSaves,
    checkForSaves
  } = useSaveSystem({
    quizId: quiz.id,
    autoSaveInterval: 30000, // 30 seconds
    maxManualSlots: 3
  });

  // Initialize state with proper typing
  const [state, setState] = useState<QuizState>(() => {
    console.log('Initializing quiz state');
    console.log('Initial state provided:', initialState);
    console.log('Current save slots:', saveSlots);

    // Always start with a fresh state
    const freshState: QuizState = {
      currentQuestionIndex: 0,
      answers: Object.fromEntries(quiz.questions.map(q => [q.id, ''])),
      markedForReview: [],
      timeRemaining: quiz.settings.timeLimit,
      isPaused: true,
      startTime: Date.now(),
      totalPausedTime: 0,
      isComplete: false
    };

    // If initial state is provided, merge it
    if (initialState) {
      console.log('Using provided initial state');
      return {
        ...freshState,
        ...initialState,
        answers: {
          ...freshState.answers,
          ...initialState.answers
        }
      };
    }

    // Check for saves but don't automatically load them
    checkForSaves();
    return freshState;
  });

  // Check for existing saves when component mounts
  useEffect(() => {
    console.log('Checking for saves for quiz:', quiz.id);
    console.log('Current save slots:', saveSlots);
    
    // Force a check for saves
    const hasSaves = checkForSaves();
    console.log('Has saves:', hasSaves);
    
    if (hasSaves && !state.isComplete) {
      // Always show load dialog first if there are any saves
      setShowLoadDialog(true);
      toast.info("Found existing saves!", {
        description: "Choose to resume or start fresh",
        duration: 4000
      });
    }
  }, [quiz.id, checkForSaves]); // Only run on mount and quiz ID change

  // Ensure saves are checked when quiz ID changes
  useEffect(() => {
    checkForSaves();
  }, [quiz.id, checkForSaves]);

  // Debug saves whenever they change
  useEffect(() => {
    console.log('Save slots updated:', saveSlots);
  }, [saveSlots]);

  // Handle start quiz
  const handleStartQuiz = () => {
    setState(prev => ({
      ...prev,
      isPaused: false,
      startTime: Date.now()
    }));

    // Show prominent notification
    toast.success("Quiz started!", {
      description: "Your progress will be automatically saved",
      duration: 4000
    });

    // Create initial autosave and show it
    setupAutosave(state);
    
    // Check for saves and show dialog after a short delay
    setTimeout(() => {
      const hasSaves = checkForSaves();
      if (hasSaves) {
        setShowSaveDialog(true);
      }
    }, 200);
  };

  // Add button to check for saves
  const handleCheckSaves = () => {
    const hasSaves = checkForSaves();
    if (hasSaves) {
      setShowSaveDialog(true);
      toast.info("Found existing saves!");
    } else {
      toast.info("No saves found");
    }
  };

  // Setup autosave when the quiz starts or resumes
  useEffect(() => {
    let cleanup = () => {};
    
    if (!state.isPaused && !state.isComplete) {
      cleanup = setupAutosave({
        ...state,
        timeRemaining: state.timeRemaining || quiz.settings.timeLimit
      });
      
      // Only show notification on first autosave
      const existingAutosave = saveSlots.find(slot => slot.isAutosave);
      if (!existingAutosave) {
        toast.info("Progress will be saved automatically", {
          description: "Click 'Check Saves' to view your progress",
          duration: 3000
        });
      }
    }
    
    return () => cleanup();
  }, [state.isPaused, state.isComplete, setupAutosave, quiz.settings.timeLimit]);

  // Update parent component on state changes
  useEffect(() => {
    if (onStateUpdate) {
      onStateUpdate(state);
    }
  }, [state, onStateUpdate]);

  const getQuestionStatus = (questionId: string) => {
    if (state.markedForReview.includes(questionId)) return "review";
    // Check if the question has a non-empty answer
    if (state.answers[questionId] && state.answers[questionId].length > 0) return "attempted";
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
    console.log('Selecting answer:', answer, 'for question:', currentQuestion.id);
    console.log('Previous answers:', state.answers);
    
    setState((prev) => {
      const newAnswers = {
        ...prev.answers,
        [currentQuestion.id]: answer, // Always set the answer, don't toggle
      };
      
      console.log('Updated answers:', newAnswers);
      return {
        ...prev,
        answers: newAnswers,
      };
    });
  };

  const handlePauseToggle = () => {
    if (state.isPaused) {
      // Starting/resuming the quiz
      setState(prev => ({
        ...prev,
        isPaused: false,
        startTime: Date.now()
      }));
      
      // Show prominent notification
      toast.success("Quiz resumed!", {
        description: "Your progress will continue to be saved automatically",
        duration: 4000
      });

      // Create/update autosave and show it
      setTimeout(() => {
        setupAutosave(state);
        setShowSaveDialog(true);
      }, 100);
    } else {
      // Pausing the quiz
      setState(prev => ({
        ...prev,
        isPaused: true
      }));
      
      // Show current saves and notification
      setShowSaveDialog(true);
      toast.info("Quiz paused", {
        description: "Your progress has been saved",
        duration: 3000
      });
    }
  };

  const handleTimeUpdate = (newTime: number) => {
    setState(prev => ({
      ...prev,
      timeRemaining: newTime
    }));
  };

  const saveAndNavigate = async (finalState: QuizState, isTimeUp = false) => {
    try {
      console.log('Saving quiz with state:', finalState);
      console.log('Current answers:', finalState.answers);

      // Validate answers
      const answeredQuestions = Object.values(finalState.answers).filter(a => a && a.length > 0).length;
      console.log(`Answered ${answeredQuestions} out of ${quiz.questions.length} questions`);

      // Clear any existing saves
      clearAllSaves();

      // Save result
      const result = await Promise.resolve(saveResult(quiz, finalState));
      console.log('Saved result:', result);

      // Verify the result was saved
      const savedResults = JSON.parse(localStorage.getItem('quiz-results') || '[]');
      const savedResult = savedResults.find((r: any) => r.id === result.id);

      if (!savedResult) {
        throw new Error('Failed to save result to localStorage');
      }

      // Complete the quiz
      onComplete(finalState);

      // Show notifications
      if (isTimeUp) {
        toast.warning("Time's up!");
      } else {
        toast.success("Quiz completed!", {
          description: `Score: ${result.score.percentage.toFixed(1)}%`,
          duration: 3000
        });
      }

      // Wait a moment to ensure state is updated
      await new Promise(resolve => setTimeout(resolve, 100));

      // Show results locally first
      setShowResults(true);

      // Then navigate after a short delay
      setTimeout(() => {
        navigate(`/results/${result.id}`);
      }, 500);

      return result;
    } catch (error) {
      console.error('Error saving quiz:', error);
      toast.error("Failed to save results. Showing local results.");
      setShowResults(true);
      throw error;
    }
  };

  const handleTimeUp = async () => {
    try {
      // Create final state
      const finalState: QuizState = {
        ...state,
        isComplete: true,
        isPaused: true,
        timeRemaining: 0,
        answers: { ...state.answers }
      };

      // Update state
      setState(finalState);

      // Save and navigate
      await saveAndNavigate(finalState, true);
    } catch (error) {
      console.error('Error in handleTimeUp:', error);
      toast.error("Failed to save results. Showing local results.");
      setShowResults(true);
    }
  };

  const handleComplete = async () => {
    try {
      // Show initial notification
      toast.info("Completing quiz...");

      // Create final state
      const finalState: QuizState = {
        ...state,
        isComplete: true,
        isPaused: true,
        timeRemaining: 0,
        answers: { ...state.answers }
      };

      // Update state
      setState(finalState);

      // Save and navigate
      await saveAndNavigate(finalState, false);
    } catch (error) {
      console.error('Error in handleComplete:', error);
      toast.error("Failed to save results. Please try again.");
      
      // Reset completion state
      setState(prev => ({
        ...prev,
        isComplete: false,
        isPaused: true
      }));
    }
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
    console.log('Loading save:', id);
    const loadedState = loadSave(id);
    if (loadedState) {
      console.log('Found save state:', loadedState);
      setState(loadedState); // Use loaded state directly
      setShowLoadDialog(false);
      setShowSaveDialog(false);
      toast.success(`Save loaded successfully! ${!loadedState.isPaused ? 'Timer resumed.' : 'Click play to start timer.'}`);
      
      // Force a check for saves after loading
      setTimeout(() => {
        checkForSaves();
      }, 100);
    } else {
      console.log('No save state found, resetting to fresh state');
      handleStartFresh();
      toast.error("Could not load save. Starting fresh quiz.");
    }
  };

  const handleDeleteSave = (id: string) => {
    console.log('Deleting save:', id);
    const slot = saveSlots.find(s => s.id === id);
    console.log('Found slot:', slot);
    
    // Only reset state if deleting the currently loaded save or an autosave
    const isCurrentSave = slot?.state.startTime === state.startTime;
    
    if (slot?.isAutosave || isCurrentSave) {
      // Create fresh state
      const freshState = {
        currentQuestionIndex: 0,
        answers: Object.fromEntries(quiz.questions.map(q => [q.id, ''])),
        markedForReview: [],
        timeRemaining: quiz.settings.timeLimit,
        isPaused: true,
        startTime: Date.now(),
        totalPausedTime: 0,
        isComplete: false
      };
      setState(freshState);
      
      if (slot?.isAutosave) {
        toast.info("Autosave deleted. Quiz reset to start.", {
          description: "A new autosave will be created when you resume",
          duration: 4000
        });
      } else {
        toast.info("Current save deleted. Quiz reset to start.");
      }
    } else {
      toast.success("Save deleted successfully");
    }

    // Delete the save
    deleteSave(id);
    setShowLoadDialog(false);
    setShowSaveDialog(false);

    // Force a check for any remaining saves
    setTimeout(() => {
      const hasSaves = checkForSaves();
      if (hasSaves) {
        setShowSaveDialog(true);
      }
    }, 100);
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
    toast.info("Quiz reset. New autosave will be created when you start the quiz.", {
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

  useEffect(() => {
    console.log('Time Remaining:', state.timeRemaining);
    console.log('Is Paused:', state.isPaused);
  }, [state.timeRemaining, state.isPaused]);

  // Show results locally if needed
  if (showResults) {
    console.log('Showing local results');
    console.log('Quiz:', quiz);
    console.log('State:', state);
    console.log('Current answers:', state.answers);
    
    // Ensure we have valid data
    if (!quiz || !state || !state.answers) {
      console.error('Invalid data for results');
      return (
        <div className="text-center p-4">
          <p className="text-muted-foreground">Error: Invalid quiz data</p>
          <Button onClick={handleRetry} className="mt-4">Try Again</Button>
        </div>
      );
    }

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
            <div className="flex items-center gap-4 justify-end">
              <Timer
                initialTime={state.timeRemaining}
                isPaused={state.isPaused}
                onPauseToggle={handlePauseToggle}
                onTimeUp={handleTimeUp}
                onTick={handleTimeUpdate}
              />
              <ThemeToggle />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCheckSaves}
                  className="text-primary"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Check Saves
                </Button>
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
          </div>

          <QuizProgress
            totalQuestions={quiz.questions.length}
            attemptedQuestions={Object.values(state.answers).filter(answer => answer && answer.length > 0).length}
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
            <AlertDialogTitle>Resume Quiz?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>Found {saveSlots.length} saved {saveSlots.length === 1 ? 'session' : 'sessions'}.</p>
              <div className="space-y-2">
                {saveSlots.map((slot) => (
                  <div key={slot.id} className="flex items-center justify-between p-2 rounded-lg border bg-card">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{slot.name}</span>
                      {slot.isAutosave && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Auto</span>
                      )}
                      <span className="text-sm text-muted-foreground">
                        ({format(slot.timestamp, 'MMM d, h:mm a')})
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const loadedState = loadSave(slot.id);
                        if (loadedState) {
                          setState(loadedState);
                          setShowLoadDialog(false);
                          toast.success(`Save loaded successfully! ${!loadedState.isPaused ? 'Timer resumed.' : 'Click play to start timer.'}`);
                        }
                      }}
                    >
                      Load
                    </Button>
                  </div>
                ))}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleStartFresh}>
              Start Fresh Quiz
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              setShowLoadDialog(false);
              setShowSaveDialog(true);
            }}>
              View All Saves
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
