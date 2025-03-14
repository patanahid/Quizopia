import { useState, useEffect } from "react";
import { Quiz } from "@/types/quiz";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate, useParams } from "react-router-dom";
import { CodeBlock } from "@/components/ui/code-block";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Copy } from "lucide-react";
import { toast } from "sonner";

interface JsonQuizEditorProps {
  quiz: Quiz;
  onQuizUpdate: (updatedQuiz: Quiz) => void;
}

export function JsonQuizEditor({ quiz, onQuizUpdate }: JsonQuizEditorProps) {
  const [jsonInput, setJsonInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    // Initialize the JSON input with the current quiz
    setJsonInput(JSON.stringify(quiz, null, 2));
  }, [quiz]);

  const validateQuiz = (quiz: any): quiz is Quiz => {
    if (!quiz.id || typeof quiz.id !== "string") {
      throw new Error("Quiz must have a string ID");
    }
    if (!quiz.title || typeof quiz.title !== "string") {
      throw new Error("Quiz must have a string title");
    }
    if (!quiz.description || typeof quiz.description !== "string") {
      throw new Error("Quiz must have a string description");
    }
    if (!Array.isArray(quiz.questions) || quiz.questions.length === 0) {
      throw new Error("Quiz must have an array of questions");
    }

    quiz.questions.forEach((q: any, index: number) => {
      if (!q.id || typeof q.id !== "string") {
        throw new Error(`Question ${index + 1} must have a string ID`);
      }
      if (!q.type || q.type !== "MCQ") {
        throw new Error(`Question ${index + 1} must have type "MCQ"`);
      }
      if (!q.text || typeof q.text !== "string") {
        throw new Error(`Question ${index + 1} must have text`);
      }
      if (!Array.isArray(q.choices) || q.choices.length !== 4) {
        throw new Error(`Question ${index + 1} must have exactly 4 choices`);
      }
      if (!q.correctAnswer || typeof q.correctAnswer !== "string") {
        throw new Error(`Question ${index + 1} must have a correct answer`);
      }
      if (!q.explanation || typeof q.explanation !== "string") {
        throw new Error(`Question ${index + 1} must have an explanation`);
      }

      q.choices.forEach((c: any, choiceIndex: number) => {
        if (!c.id || typeof c.id !== "string") {
          throw new Error(`Choice ${choiceIndex + 1} in question ${index + 1} must have an ID`);
        }
        if (!c.text || typeof c.text !== "string") {
          throw new Error(`Choice ${choiceIndex + 1} in question ${index + 1} must have text`);
        }
      });
    });

    if (!quiz.settings || typeof quiz.settings !== "object") {
      throw new Error("Quiz must have settings");
    }
    if (typeof quiz.settings.timeLimit !== "number" || quiz.settings.timeLimit <= 0) {
      throw new Error("Quiz settings must have a positive timeLimit");
    }
    if (typeof quiz.settings.shuffleQuestions !== "boolean") {
      throw new Error("Quiz settings must have a shuffleQuestions boolean");
    }

    return true;
  };

  const handleSave = () => {
    try {
      const updatedQuiz = JSON.parse(jsonInput);
      if (validateQuiz(updatedQuiz)) {
        // Ensure the quiz ID remains the same
        updatedQuiz.id = id || updatedQuiz.id;
        onQuizUpdate(updatedQuiz);
        toast.success("Quiz updated successfully");
        navigate("/");
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Invalid JSON format");
      toast.error("Failed to update quiz: " + (error instanceof Error ? error.message : "Invalid JSON format"));
    }
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(jsonInput);
    toast.success("Quiz JSON copied to clipboard");
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl space-y-8 animate-fade-in">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Edit Quiz JSON</h1>
        <div className="flex items-center gap-2">
          <Button onClick={handleSave} className="bg-primary">
            Save Changes
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Copy className="h-4 w-4 mr-2" />
                Copy JSON
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Quiz JSON</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <CodeBlock 
                  code={jsonInput}
                  language="json"
                />
                <Button onClick={handleCopyJson} className="w-full">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy to Clipboard
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Quiz JSON</label>
          <Textarea
            value={jsonInput}
            onChange={(e) => {
              setJsonInput(e.target.value);
              setError(null);
            }}
            className="font-mono h-[60vh]"
            placeholder="Enter quiz JSON here..."
          />
        </div>
        {error && (
          <div className="text-red-500 text-sm">
            Error: {error}
          </div>
        )}
      </div>
    </div>
  );
} 