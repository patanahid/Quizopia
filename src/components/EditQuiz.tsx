import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Quiz } from "@/types/quiz";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { sampleQuiz } from "@/data/sample-quiz";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "github-markdown-css/github-markdown-light.css";
import "github-markdown-css/github-markdown-dark.css";
import { Copy } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CodeBlock } from "@/components/ui/code-block";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface EditQuizProps {
  id?: string;
  quizzes: Quiz[];
  setQuizzes: (quizzes: Quiz[]) => void;
  editQuiz?: Quiz | null;
}

export function EditQuiz({ id, quizzes, setQuizzes, editQuiz }: EditQuizProps) {
  const navigate = useNavigate();
  const [desiredQuestionCount, setDesiredQuestionCount] = useState<number>(0);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));

  const [quiz, setQuiz] = useState<Quiz>({
    id: "",
    title: "",
    description: "",
    questions: [],
    settings: {
      timeLimit: 600,
      shuffleQuestions: false,
    },
  });

  useEffect(() => {
    if (editQuiz) {
      setQuiz(editQuiz);
      setDesiredQuestionCount(editQuiz.questions.length);
    }
  }, [editQuiz]);

  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setIsDark(document.documentElement.classList.contains('dark'));
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  const handleQuestionCountChange = (count: number) => {
    const newCount = Math.max(0, count);
    setDesiredQuestionCount(newCount);

    // If reducing questions
    if (newCount < quiz.questions.length) {
      const questionsToRemove = quiz.questions.length - newCount;
      const confirmMessage = `This will remove ${questionsToRemove} question${questionsToRemove > 1 ? 's' : ''}. Are you sure?`;
      
      if (window.confirm(confirmMessage)) {
        setQuiz({
          ...quiz,
          questions: quiz.questions.slice(0, newCount)
        });
      } else {
        // Reset the input to current question count if user cancels
        setDesiredQuestionCount(quiz.questions.length);
      }
    }
    // If increasing questions
    else if (newCount > quiz.questions.length) {
      const newQuestions = Array(newCount - quiz.questions.length).fill(null).map(() => ({
        id: uuidv4(),
        type: "MCQ" as const,
        text: "",
        choices: [
          { id: "A", text: "" },
          { id: "B", text: "" },
          { id: "C", text: "" },
          { id: "D", text: "" }
        ],
        correctAnswer: "",
        explanation: ""
      }));

      setQuiz({
        ...quiz,
        questions: [...quiz.questions, ...newQuestions]
      });
    }
  };

  const handleDeleteQuestion = (questionId: string) => {
    if (quiz.questions.length <= 1) {
      toast.error("Quiz must have at least one question");
      return;
    }
    setQuestionToDelete(questionId);
    setShowDeleteDialog(true);
  };

  const confirmDeleteQuestion = () => {
    if (questionToDelete) {
      setQuiz((prev) => ({
        ...prev,
        questions: prev.questions.filter((q) => q.id !== questionToDelete),
      }));
      setDesiredQuestionCount((prev) => prev - 1);
      setShowDeleteDialog(false);
      setQuestionToDelete(null);
      toast.success("Question deleted");
    }
  };

  const handleSave = () => {
    if (!quiz.title.trim()) {
      toast.error("Please enter a quiz title");
      return;
    }

    if (quiz.questions.length === 0) {
      toast.error("Please add at least one question");
      return;
    }

    // Validate each question
    for (const question of quiz.questions) {
      if (!question.text.trim()) {
        toast.error("All questions must have text");
        return;
      }

      if (!question.correctAnswer) {
        toast.error("All questions must have a correct answer");
        return;
      }

      if (question.choices && question.choices.length < 2) {
        toast.error("Multiple choice questions must have at least 2 choices");
        return;
      }
    }

    // If creating a new quiz
    if (!id) {
      const newQuiz = {
        ...quiz,
        id: uuidv4(),
      };
      setQuizzes([...quizzes, newQuiz]);
      toast.success("Quiz created successfully");
    }
    // If editing an existing quiz
    else {
      setQuizzes(quizzes.map((q) => (q.id === id ? quiz : q)));
      toast.success("Quiz updated successfully");
    }
    navigate("/");
  };

  const handleQuestionChange = (questionId: string, field: string, value: string) => {
    setQuiz((prev) => ({
      ...prev,
      questions: prev.questions.map((q) =>
        q.id === questionId 
          ? { ...q, [field]: value } as Quiz["questions"][number]  // Type assertion to ensure it's a Question
          : q
      ),
    }));
  };

  const handleCopyJson = () => {
    const quizJson = {
      ...quiz,
      id: quiz.id || uuidv4(),
    };
    navigator.clipboard.writeText(JSON.stringify(quizJson, null, 2));
    toast.success("Quiz JSON copied to clipboard");
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl space-y-8 animate-fade-in">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Button onClick={handleSave} className="bg-primary">
            {id ? "Save Changes" : "Create Quiz"}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              const newSampleQuiz = {
                ...sampleQuiz,
                id: id || "",
                questions: sampleQuiz.questions.map(q => ({
                  ...q,
                  id: uuidv4(),
                  choices: q.choices?.map(c => ({ ...c }))
                }))
              };
              setQuiz(newSampleQuiz);
              setDesiredQuestionCount(newSampleQuiz.questions.length);
              toast.success("Sample quiz loaded");
            }}
          >
            Load Sample Quiz
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
                  code={JSON.stringify({ ...quiz, id: quiz.id || uuidv4() }, null, 2)}
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
        <Button variant="outline" onClick={() => navigate("/")}>
          Cancel
        </Button>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Quiz Title</Label>
            <Input
              id="title"
              value={quiz.title}
              onChange={(e) => setQuiz((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Enter quiz title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={quiz.description}
              onChange={(e) =>
                setQuiz((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Enter quiz description"
            />
          </div>

          <div className="space-y-2">
            <Label>Time Limit</Label>
            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="hours">Hours</Label>
                <Input
                  id="hours"
                  type="number"
                  min="0"
                  max="23"
                  value={Math.floor(quiz.settings.timeLimit / 3600)}
                  onChange={(e) => {
                    const hours = Math.max(0, parseInt(e.target.value) || 0);
                    const minutes = Math.floor((quiz.settings.timeLimit % 3600) / 60);
                    setQuiz({
                      ...quiz,
                      settings: {
                        ...quiz.settings,
                        timeLimit: hours * 3600 + minutes * 60,
                      },
                    });
                  }}
                  placeholder="Hours"
                />
              </div>
              <div className="flex-1 space-y-2">
                <Label htmlFor="minutes">Minutes</Label>
                <Input
                  id="minutes"
                  type="number"
                  min="0"
                  max="59"
                  value={Math.floor((quiz.settings.timeLimit % 3600) / 60)}
                  onChange={(e) => {
                    const minutes = Math.max(0, parseInt(e.target.value) || 0);
                    const hours = Math.floor(quiz.settings.timeLimit / 3600);
                    setQuiz({
                      ...quiz,
                      settings: {
                        ...quiz.settings,
                        timeLimit: hours * 3600 + minutes * 60,
                      },
                    });
                  }}
                  placeholder="Minutes"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="questionCount">Number of Questions</Label>
            <Input
              id="questionCount"
              type="number"
              value={desiredQuestionCount}
              onChange={(e) => handleQuestionCountChange(parseInt(e.target.value))}
              min="1"
              step="1"
            />
          </div>
        </div>
      </Card>

      <div className="space-y-6">
        {quiz.questions.map((question, index) => (
          <Card key={question.id} className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Question {index + 1}</h3>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteQuestion(question.id)}
                >
                  Delete Question
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Question Text (Supports Markdown)</Label>
                <Tabs defaultValue="edit" className="w-full">
                  <TabsList>
                    <TabsTrigger value="edit">Edit</TabsTrigger>
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                  </TabsList>
                  <TabsContent value="edit">
                    <Textarea
                      value={question.text}
                      onChange={(e) =>
                        handleQuestionChange(question.id, "text", e.target.value)
                      }
                      placeholder="Enter question text"
                      className="min-h-[100px] font-mono"
                    />
                  </TabsContent>
                  <TabsContent value="preview" className="rounded-lg border p-4">
                    <div className={`markdown-body ${isDark ? 'markdown-dark' : ''}`}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {question.text || "*No content*"}
                      </ReactMarkdown>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              <div className="space-y-4">
                <Label>Choices</Label>
                {question.choices.map((choice, choiceIndex) => (
                  <div key={choice.id} className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Label className="w-8">{String.fromCharCode(65 + choiceIndex)})</Label>
                      <Tabs defaultValue="edit" className="w-full">
                        <TabsList>
                          <TabsTrigger value="edit">Edit</TabsTrigger>
                          <TabsTrigger value="preview">Preview</TabsTrigger>
                        </TabsList>
                        <TabsContent value="edit">
                          <Textarea
                            value={choice.text}
                            onChange={(e) =>
                              setQuiz((prev) => ({
                                ...prev,
                                questions: prev.questions.map((q) =>
                                  q.id === question.id
                                    ? {
                                        ...q,
                                        choices: q.choices?.map((c) =>
                                          c.id === choice.id
                                            ? { ...c, text: e.target.value }
                                            : c
                                        ),
                                      } as Quiz["questions"][number]
                                    : q
                                ),
                              }))
                            }
                            placeholder={`Enter choice ${String.fromCharCode(65 + choiceIndex)}`}
                            className="font-mono"
                          />
                        </TabsContent>
                        <TabsContent value="preview" className="rounded-lg border p-4">
                          <div className={`markdown-body ${isDark ? 'markdown-dark' : ''}`}>
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {choice.text || "*No content*"}
                            </ReactMarkdown>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label>Correct Answer</Label>
                <div className="flex gap-4">
                  {question.choices.map((choice, choiceIndex) => (
                    <Button
                      key={choice.id}
                      variant={question.correctAnswer === choice.id ? "default" : "outline"}
                      onClick={() =>
                        handleQuestionChange(question.id, "correctAnswer", choice.id)
                      }
                    >
                      {String.fromCharCode(65 + choiceIndex)}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Explanation (Supports Markdown)</Label>
                <Tabs defaultValue="edit" className="w-full">
                  <TabsList>
                    <TabsTrigger value="edit">Edit</TabsTrigger>
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                  </TabsList>
                  <TabsContent value="edit">
                    <Textarea
                      value={question.explanation}
                      onChange={(e) =>
                        handleQuestionChange(question.id, "explanation", e.target.value)
                      }
                      placeholder="Enter explanation"
                      className="min-h-[100px] font-mono"
                    />
                  </TabsContent>
                  <TabsContent value="preview" className="rounded-lg border p-4">
                    <div className={`markdown-body ${isDark ? 'markdown-dark' : ''}`}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {question.explanation || "*No content*"}
                      </ReactMarkdown>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </Card>
        ))}

        <Button
          onClick={() =>
            handleQuestionCountChange(desiredQuestionCount + 1)
          }
          className="w-full"
        >
          Add Question
        </Button>
      </div>

      <div className="flex justify-end gap-4 mt-8">
        <Button variant="outline" onClick={() => navigate("/")}>
          Cancel
        </Button>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Question</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this question? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteQuestion}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
