import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Search, Plus, Copy } from "lucide-react";
import { Quiz } from "@/types/quiz";
import { Link, useNavigate } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { JsonQuizCreator } from "./JsonQuizCreator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface HomePageProps {
  quizzes: Quiz[];
  setQuizzes: (quizzes: Quiz[]) => void;
}

export function HomePage({ quizzes, setQuizzes }: HomePageProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const navigate = useNavigate();

  const handleDelete = (id: string) => {
    if (quizzes.length <= 1) {
      toast.error("Cannot delete the last quiz");
      return;
    }
    setQuizzes(quizzes.filter((quiz) => quiz.id !== id));
    toast.success("Quiz deleted successfully");
  };

  const handleClearSave = (id: string) => {
    localStorage.removeItem(`quiz-${id}-save`);
    toast.success("Saved progress cleared");
  };

  const handleCreateQuiz = () => {
    navigate(`/quiz/new`);
  };

  const copyPromptToClipboard = () => {
    const promptText = `Make these pdf questions into this format,make sure that you yourself add the answers from the answer key strictly in the correct answer field, not from your own knowledge, you can only add your info in the explanation and concise explanation in Hindi, if there is any mistake in the answer key you think, mention that in the explanation.Use your mind and context to make the questions format and options understandable if they seem corrupted, make sure the options dont contain the a b c d, part of the options again, use your mind to look if the formatting makes sense and what could be the correct one, the answer you write as correct answer should be from the key. format the tubular options into this format a) A - 1, b - 2, ...., make sure there are no errors, dont stop untill you write the full code, youcan use markdown tables make sure the headers contain the info about the rows, not separate info, in questions, and do not hullucinate, do not write questions that youare not provided with and dont guess questions, make sure you not skip the id of the options, make sure it doesnt have errors, the time should be 3 hours.`;
    navigator.clipboard.writeText(promptText);
    toast.success("Prompt copied to clipboard!");
  };

  const copyCodeToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied to clipboard!");
  };

  const filteredQuizzes = quizzes
    .filter((quiz) =>
      quiz.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortOrder === "asc") {
        return a.title.localeCompare(b.title);
      }
      return b.title.localeCompare(a.title);
    });

  return (
    <div className="container mx-auto p-4 space-y-6 animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Available Quizzes</h1>
        <div className="flex items-center gap-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Copy className="h-4 w-4 mr-2" />
                Copy Prompt
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Quiz Format Prompt</DialogTitle>
                <DialogDescription className="space-y-4">
                  <p>Use this format to create quizzes from PDF questions:</p>
                  <div className="relative">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="absolute top-2 right-2 h-8 w-8 p-0"
                      onClick={() => copyCodeToClipboard(`{
  "id": "unique_id",
  "title": "Quiz Title",
  "description": "A detailed description of your quiz that supports **markdown**",
  "questions": [
    {
      "id": "q1",
      "type": "MCQ",
      "text": "Question text here",
      "choices": [
        {
          "id": "a",
          "text": "Option text"
        }
      ],
      "correctAnswer": "a",
      "explanation": "Explanation here"
    }
  ],
  "settings": {
    "timeLimit": 10800,
    "shuffleQuestions": false
  }
}`)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm max-h-[60vh] whitespace-pre-wrap">
{`{
  "id": "unique_id",
  "title": "Quiz Title",
  "description": "A detailed description of your quiz that supports **markdown**",
  "questions": [
    {
      "id": "q1",
      "type": "MCQ",
      "text": "Question text here",
      "choices": [
        {
          "id": "a",
          "text": "Option text"
        }
      ],
      "correctAnswer": "a",
      "explanation": "Explanation here"
    }
  ],
  "settings": {
    "timeLimit": 10800,
    "shuffleQuestions": false
  }
}`}
                    </pre>
                  </div>
                  <Button onClick={copyPromptToClipboard} className="w-full">
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Prompt
                  </Button>
                </DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
          <Button onClick={handleCreateQuiz}>
            <Plus className="h-4 w-4 mr-2" />
            Create Quiz
          </Button>
          <ThemeToggle />
        </div>
      </div>
      
      <div className="flex gap-4 items-center mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder="Search quizzes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={sortOrder}
          onValueChange={(value: "asc" | "desc") => setSortOrder(value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort order" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">Title (A-Z)</SelectItem>
            <SelectItem value="desc">Title (Z-A)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">Quizopia</h1>
          <Link to="/quiz/new">
            <Button>Create New Quiz</Button>
          </Link>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Clear All Data</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action will permanently delete all your quizzes and saved progress.
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    window.localStorage.clear();
                    setQuizzes([]);
                    toast.success("All data cleared successfully");
                  }}
                >
                  Clear All Data
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Quiz List</TabsTrigger>
          <TabsTrigger value="json">Create from JSON</TabsTrigger>
        </TabsList>
        
        <TabsContent value="list" className="space-y-4">
          {filteredQuizzes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No quizzes found</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredQuizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="bg-card p-6 rounded-lg shadow-sm border border-border"
                >
                  <h2 className="text-xl font-semibold mb-2">{quiz.title}</h2>
                  <p className="text-muted-foreground mb-4">{quiz.description}</p>
                  <div className="flex flex-col md:flex-row gap-2 mt-4">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => navigate(`/quiz/${quiz.id}`)}
                    >
                      Start Quiz
                    </Button>
                    {localStorage.getItem(`quiz-${quiz.id}-save`) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleClearSave(quiz.id)}
                      >
                        Clear Save
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/quiz/${quiz.id}/edit`)}
                    >
                      Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" about="">
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Quiz</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this quiz? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction color="red" onClick={() => handleDelete(quiz.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="json">
          <JsonQuizCreator onQuizCreate={(quiz) => setQuizzes([...quizzes, quiz])} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
