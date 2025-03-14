import { useParams } from "react-router-dom";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { JsonQuizEditor } from "@/components/JsonQuizEditor";
import { sampleQuiz } from "@/data/sample-quiz";

export default function JsonEditQuiz() {
  const { id } = useParams();
  const [quizzes, setQuizzes] = useLocalStorage("quizzes", [sampleQuiz]);

  const quiz = quizzes.find((q) => q.id === id);

  if (!quiz) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold text-red-500">Quiz not found</h1>
      </div>
    );
  }

  const handleQuizUpdate = (updatedQuiz: Quiz) => {
    setQuizzes(quizzes.map((q) => (q.id === id ? updatedQuiz : q)));
  };

  return <JsonQuizEditor quiz={quiz} onQuizUpdate={handleQuizUpdate} />;
} 