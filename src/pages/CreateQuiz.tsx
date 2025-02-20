import { Header } from "@/components/Header";
import { EditQuiz } from "@/components/EditQuiz";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { sampleQuiz } from "@/data/sample-quiz";

export default function CreateQuiz() {
  const [storedQuizzes, setStoredQuizzes] = useLocalStorage("quizzes", [sampleQuiz]);

  const emptyQuiz = {
    id: "",
    title: "New Quiz",
    description: "A new quiz",
    questions: [],
    settings: {
      timeLimit: 600,
      shuffleQuestions: false,
    },
  };

  return (
    <div className="container py-6">
      <Header />
      <EditQuiz
        quizzes={storedQuizzes}
        setQuizzes={setStoredQuizzes}
        editQuiz={emptyQuiz}
      />
    </div>
  );
}
