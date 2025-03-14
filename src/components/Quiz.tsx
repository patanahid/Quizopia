import { useState, useEffect } from "react";
import type { Quiz, QuizState } from "@/types/quiz";
import { QuestionStatus } from "./QuestionStatus";
import Timer from "./Timer";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, ArrowRight, BookmarkPlus, Save } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";

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

  // Handle start quiz
  const handleStartQuiz = () => {
    // Clear any existing saves first
    clearAllSaves();
    
    const newState = {
      ...state,
      isPaused: false,
      startTime: Date.now()
    };
    
    setState(newState);

    // Show prominent notification
    toast.success("Quiz started!", {
      description: "Your progress will be automatically saved",
      duration: 4000
    });

    // Create initial autosave
    setupAutosave(newState);
  };

  // Handle start fresh quiz
  const handleStartFresh = () => {
    // Clear all saves first
    clearAllSaves();
    
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
    setShowLoadDialog(false);
    toast.success("Quiz ready to start!");
  };

  // Handle load save
  const handleLoadSave = (id: string) => {
    console.log('Loading save:', id);
    const loadedState = loadSave(id);
    if (loadedState) {
      console.log('Found save state:', loadedState);
      
      // Calculate total paused time and adjust start time
      const now = Date.now();
      const timeElapsed = now - loadedState.startTime;
      const adjustedStartTime = now - timeElapsed;
      
      const updatedState = {
        ...loadedState,
        startTime: adjustedStartTime,
        isPaused: false // Start the timer automatically
      };
      
      setState(updatedState);
      setShowLoadDialog(false);
      
      // Create a new autosave with the updated state
      setupAutosave(updatedState);
      
      // Show the save dialog to display current saves
      setShowSaveDialog(true);
      
      toast.success('Save loaded successfully! Timer started.');
    } else {
      console.log('No save state found, resetting to fresh state');
      handleStartFresh();
      toast.error("Could not load save. Starting fresh quiz.");
    }
  };

  // Handle delete save
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
      toast.success("Save deleted successfully.");
    }

    // Delete the save
    deleteSave(id);
    setShowLoadDialog(false);
    setShowSaveDialog(false);
  };

  // Handle clear all saves
  const handleClearAllSaves = () => {
    clearAllSaves();
    // Reset to fresh state
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
    setShowSaveDialog(false);
    toast.info("Quiz reset. New autosave will be created when you start the quiz.", {
      duration: 4000
    });
  };

  // Ensure saves are checked when quiz ID changes
  useEffect(() => {
    checkForSaves();
  }, [quiz.id, checkForSaves]);

  // Debug saves whenever they change
  useEffect(() => {
    console.log('Save slots updated:', saveSlots);
  }, [saveSlots]);

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
    setState((prev) => {
      const newAnswers = {
        ...prev.answers,
        [currentQuestion.id]: prev.answers[currentQuestion.id] === answer ? '' : answer, // Toggle answer
      };
      return {
        ...prev,
        answers: newAnswers,
      };
    });
  };

  const handlePauseToggle = () => {
    if (state.isPaused) {
      // Starting/resuming the quiz
      const newState = {
        ...state,
        isPaused: false,
        startTime: Date.now()
      };
      setState(newState);
      setupAutosave(newState);
      setShowSaveDialog(true); // Show saves after resuming
      toast.success("Quiz resumed!");
    } else {
      // Pausing the quiz
      const newState = {
        ...state,
        isPaused: true
      };
      setState(newState);
      setupAutosave(newState);
      setShowSaveDialog(true); // Show saves after pausing
      toast.info("Quiz paused");
    }
  };

  const handleTimeUpdate = (newTime: number) => {
    setState(prev => ({
      ...prev,
      timeRemaining: newTime
    }));
  };

  const saveAndNavigate = async (finalState: QuizState, isTimeUp = false) => {
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        // Show saving status
        toast.loading(
          retryCount === 0 ? "Saving quiz results..." : `Retrying save (attempt ${retryCount + 1})...`
        );

        // Clear any existing saves
        clearAllSaves();
        await new Promise(resolve => setTimeout(resolve, 200));

        // Attempt to save
        const result = await saveResult(quiz, finalState);
        
        // Complete the quiz
        onComplete(finalState);

        // Show success notification
        toast.dismiss();
        if (isTimeUp) {
          toast.warning("Time's up!");
        } else {
          toast.success("Quiz completed!", {
            description: `Score: ${result.score.percentage.toFixed(1)}%`,
            duration: 3000
          });
        }

        // Show results and navigate
        setShowResults(true);
        navigate(`/results/${result.id}`);
        return result;

      } catch (error) {
        console.error(`Save attempt ${retryCount + 1} failed:`, error);
        retryCount++;
        
        if (retryCount === maxRetries) {
          toast.dismiss();
          toast.error(
            "Failed to save quiz results. Please try refreshing the page and completing the quiz again.",
            { duration: 5000 }
          );
          throw error;
        }
        
        // Wait longer between each retry
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    }
  };

  const handleTimeUp = async () => {
    const finalState: QuizState = {
      ...state,
      isComplete: true,
      isPaused: true,
      timeRemaining: 0,
      answers: { ...state.answers }
    };

    setState(finalState);

    try {
      await saveAndNavigate(finalState, true);
    } catch (error) {
      console.error('Error in handleTimeUp:', error);
      // Error toast is already shown by saveAndNavigate
      setShowResults(true);
    }
  };

  const handleComplete = async () => {
    const finalState: QuizState = {
      ...state,
      isComplete: true,
      isPaused: true,
      timeRemaining: 0,
      answers: { ...state.answers }
    };

    setState(finalState);

    try {
      await saveAndNavigate(finalState, false);
    } catch (error) {
      console.error('Error in handleComplete:', error);
      // Reset completion state since save failed
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
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">{quiz.title}</h1>
                <Badge variant="outline" className="ml-2">
                  {quiz.questions.length} questions
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSaveDialog(true)}
                  className="h-8"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Progress
                </Button>
                <ThemeToggle />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Timer
                  initialTime={state.timeRemaining}
                  isPaused={state.isPaused}
                  onPauseToggle={handlePauseToggle}
                  onTimeUp={handleTimeUp}
                  onTick={handleTimeUpdate}
                />
              </div>
            </CardContent>
          </Card>

          <QuizProgress
            totalQuestions={quiz.questions.length}
            attemptedQuestions={Object.values(state.answers).filter(answer => answer && answer.length > 0).length}
            markedForReview={state.markedForReview.length}
          />

          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-2">
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Question {state.currentQuestionIndex + 1} of {quiz.questions.length}
                </span>
                <Badge variant="secondary" className="ml-2">
                  {formatTime(state.timeRemaining)}
                </Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkForReview}
                className={cn(
                  "h-8",
                  state.markedForReview.includes(currentQuestion.id) && "text-red-500"
                )}
              >
                <BookmarkPlus className="h-4 w-4 mr-2" />
                {state.markedForReview.includes(currentQuestion.id) ? "Unmark" : "Mark for Review"}
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="prose dark:prose-invert max-w-none">
                <Markdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
                  components={markdownComponents}
                >
                  {currentQuestion.text}
                </Markdown>
              </div>

              <div className="space-y-3">
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
                      "w-5 h-5 mt-1 rounded-full border-2 flex-shrink-0",
                      state.answers[currentQuestion.id] === choice.id
                        ? "border-primary bg-primary"
                        : "border-muted-foreground"
                    )}>
                      {state.answers[currentQuestion.id] === choice.id && (
                        <div className="w-2.5 h-2.5 m-0.5 rounded-full bg-white" />
                      )}
                    </div>
                    <div className="prose dark:prose-invert flex-1 [&>p]:m-0">
                      <Markdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeRaw]}
                        components={markdownComponents}
                      >
                        {choice.text}
                      </Markdown>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={() => handleNavigate(state.currentQuestionIndex - 1)}
                disabled={state.currentQuestionIndex === 0}
                className="h-9"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              {state.currentQuestionIndex === quiz.questions.length - 1 ? (
                <Button onClick={handleComplete} className="h-9">
                  Complete Quiz
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => handleNavigate(state.currentQuestionIndex + 1)}
                  disabled={state.currentQuestionIndex === quiz.questions.length - 1}
                  className="h-9"
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </CardFooter>
          </Card>
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
                  <div key={slot.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{slot.name}</span>
                      {slot.isAutosave && (
                        <Badge variant="secondary" className="ml-2">
                          Auto
                        </Badge>
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
                      className="h-8"
                    >
                      Load
                    </Button>
                  </div>
                ))}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleStartFresh} className="h-9">
              Start Fresh Quiz
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              setShowLoadDialog(false);
              setShowSaveDialog(true);
            }} className="h-9">
              View All Saves
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
