import { useState, useEffect } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Header } from "@/components/Header";
import { toast } from "sonner";
import { Quiz as QuizComponent } from "@/components/Quiz";
import { Results } from "@/components/Results";
import { EditQuiz } from "@/components/EditQuiz";
import { HomePage } from "@/components/HomePage";
import { sampleQuiz } from "@/data/sample-quiz";
import { Quiz, QuizState } from "@/types/quiz";
import { v4 as uuidv4 } from "uuid";

export default function Index() {
  const [mounted, setMounted] = useState(false);
  const location = useLocation();
  const params = useParams();
  const navigate = useNavigate();
  const [storedQuizzes, setStoredQuizzes] = useLocalStorage("quizzes", [sampleQuiz]);
  const [savedQuizState, setSavedQuizState] = useLocalStorage<Record<string, QuizState>>("savedQuizStates", {});

  const emptyQuiz: Quiz = {
    id: "",
    title: "New Quiz",
    description: "A new quiz",
    questions: [],
    settings: {
      timeLimit: 600,
      shuffleQuestions: false,
    },
  };

  // Only use sampleQuiz as a fallback if we're not on a specific quiz page
  const currentQuiz = params.id === "new" 
    ? emptyQuiz
    : params.id 
      ? storedQuizzes.find(quiz => quiz.id === params.id) || null 
      : null;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (params.id && params.id !== "new" && !currentQuiz) {
      toast.error("Quiz not found");
      navigate("/");
    }
  }, [params.id, currentQuiz, navigate]);

  // If we're on the home page or quiz not found, render HomePage
  if (!params.id) {
    return (
      <div className="container py-6">
        <Header />
        <HomePage quizzes={storedQuizzes} setQuizzes={setStoredQuizzes} />
      </div>
    );
  }

  const layout = (children: React.ReactNode) => (
    <div className="container py-6">
      <Header />
      {children}
    </div>
  );

  // If we're creating a new quiz or editing
  if (params.id === "new" || location.pathname.endsWith("/edit")) {
    return layout(
      <EditQuiz
        id={params.id}
        quizzes={storedQuizzes}
        setQuizzes={setStoredQuizzes}
        editQuiz={currentQuiz}
      />
    );
  }

  // If quiz not found and not creating new
  if (!currentQuiz && params.id !== "new") {
    toast.error("Quiz not found");
    navigate("/");
    return null;
  }

  // If we're showing results
  if (savedQuizState[currentQuiz.id]?.isComplete === true) {
    return layout(
      <Results
        quiz={currentQuiz}
        state={savedQuizState[currentQuiz.id]}
        onRetry={() => {
          const newState = { ...savedQuizState };
          delete newState[currentQuiz.id];
          setSavedQuizState(newState);
          navigate(`/quiz/${currentQuiz.id}`);
        }}
      />
    );
  }

  // Otherwise show the quiz
  return layout(
    <QuizComponent
      quiz={currentQuiz}
      onComplete={(state) => {
        const newState = { ...savedQuizState };
        const updatedState = { ...state, isComplete: true };
        newState[currentQuiz.id] = updatedState;
        setSavedQuizState(newState);
      }}
      onStateUpdate={(state) => {
        const newState = { ...savedQuizState };
        newState[currentQuiz.id] = state;
        setSavedQuizState(newState);
      }}
      initialState={savedQuizState[currentQuiz.id]}
    />
  );
}
