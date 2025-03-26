import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useSaveSystem } from "@/hooks/useSaveSystem";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Search, Plus, Copy, Code, Eraser } from "lucide-react";
import { Quiz } from "@/types/quiz";
import { Link, useNavigate } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { JsonQuizCreator } from "./JsonQuizCreator";
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
import Results from "@/pages/Results";

interface HomePageProps {
  quizzes: Quiz[];
  setQuizzes: (quizzes: Quiz[]) => void;
}

export function HomePage({ quizzes, setQuizzes }: HomePageProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const navigate = useNavigate();
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const { clearAllSaves } = useSaveSystem({
    quizId: selectedQuizId || 'default',
    autoSaveInterval: 30000,
    maxManualSlots: 3
  });

  const handleClearSaves = (quizId: string) => {
    setSelectedQuizId(quizId);
    setTimeout(() => {
      clearAllSaves();
      toast.success("All saves cleared for this quiz");
    }, 0);
  };

  const handleDelete = (id: string) => {
    if (quizzes.length <= 1) {
      toast.error("Cannot delete the last quiz");
      return;
    }
    setQuizzes(quizzes.filter((quiz) => quiz.id !== id));
    toast.success("Quiz deleted successfully");
  };

  const handleCreateQuiz = () => {
    navigate(`/quiz/new`);
  };

  const handleEditQuiz = (quiz: Quiz) => {
    // Check for potential conflicts with saves
    const hasSaves = localStorage.getItem(`quiz_saves_${quiz.id}`);
    if (hasSaves) {
      // Show conflict warning dialog
      const shouldProceed = window.confirm(
        "This quiz has saved progress. Editing the quiz may cause conflicts with existing saves. Would you like to:\n\n" +
        "1. Clear saves and continue editing\n" +
        "2. Continue editing anyway\n" +
        "3. Cancel\n\n" +
        "Click OK to clear saves and continue, or Cancel to go back."
      );
      
      if (shouldProceed) {
        handleClearSaves(quiz.id);
        navigate(`/quiz/${quiz.id}/edit`);
      }
    } else {
      navigate(`/quiz/${quiz.id}/edit`);
    }
  };

  const handleJsonEdit = (quiz: Quiz) => {
    // Check for potential conflicts with saves
    const hasSaves = localStorage.getItem(`quiz_saves_${quiz.id}`);
    if (hasSaves) {
      // Show conflict warning dialog
      const shouldProceed = window.confirm(
        "This quiz has saved progress. Editing the quiz may cause conflicts with existing saves. Would you like to:\n\n" +
        "1. Clear saves and continue editing\n" +
        "2. Continue editing anyway\n" +
        "3. Cancel\n\n" +
        "Click OK to clear saves and continue, or Cancel to go back."
      );
      
      if (shouldProceed) {
        handleClearSaves(quiz.id);
        navigate(`/quiz/${quiz.id}/json-edit`);
      }
    } else {
      navigate(`/quiz/${quiz.id}/json-edit`);
    }
  };

  const copyPromptToClipboard = () => {
    const promptText = `DO NOT PROVIDE RESPONSE IN CODE BLOCKS.
    
Rewrite all of these questions in the PDF into this specified format.

Make sure that you add the answers from the answer key. If you think that the answers in the answer key are wrong, use your mind and your knowledge to analyze that. And if you think there are conflicts between you and the answer key, then specify both. But in the correctAnswer field, you should use the option from the answer key. But in the explanation, you should provide that the answer key was stating that option, but you think that the correct answer is this.

You should provide the information and the explanation, satisfactory explanation and concise explanation in Hindi in the explanation field.

Do NOT repeat any answer. There should be four options in each question and questions must not be repeated.

Use your mind and context to make the questions format and options understandable if they seem corrupted.

Make sure the options do not contain the a b c d, part of the options again.

You should use Markdown format to edit and provide the text formatting. You should use list formatting in md to provide the formatting. If the question contains lists, you should use lists.

 if the question contains tables then use tabular format of the Markdown. If there are tables, you should use table.
If the options are in tabular format, use the this format: a) A - 1, B - 2, ...., make sure there are no errors and no conflicts between the answer in the answers and the formats and the matches in the questions and your response. In the headers of the table, you should use suitable titles, use context to determine headers, if they are not provided.

Image should be preserved, You are provided with images in the PDF, and all the images that are to be used have a text written i.e. image_{n}.{ext} on top of them. You should use proper markdown image format and the extensions matter. Use those images correctly in the correct question in correct place.

Use your mind to look if the formatting makes sense and what could be the corrected.

NO information should be LEFT OUT from the questions, you can change the formatting and the look, of the question but the overall meaning should be the same.

 Only give JSON response.

DO NOT HALLUCINATE 

DO NOT write questions that you are not provided with and DO NOT guess questions, 

Make sure that you don't skip any part of the JSON format and everything should be syntactically correct and it should not and shall not have errors at any cost.

use single quotes, in the text fields to remove syntax errors with double quotes in JSON formatting. 

The time should be 3 hours (10800).

You should not other fields in the JSON. These are all the fields that you can and should use.

Make sure that you use the formatting and table and add statements from questions, formats and the headings and spacing correctly.
 


 here is the JSON format, strictly follow this format only :
    
    {
      "id": "unique_id",
      "title": "Quiz Title",
      "description": "A detailed description of your quiz that supports **markdown**",
      "questions": [
        {
          "id": "q1",
          "type": "MCQ",
          "text": "प्रश्न 11
सुमेलित कीजिए:

 | सूची 1       | सूची 2      |
 | :------------ | :---------- |
 | a स्थिर स्थल | 1. डार्विन   |
 | b हिम नियंत्रण | 2. आगासीज  |
 | c निम्मज्जन   | 3. मरें    |
 | d अपरदन     | 4. डेली    |",
          "choices": [
            {
              "id": "a",
              "text": "A - 3, B - 4, C - 1, D - 2"
            },
            {
              "id": "b",
              "text": "A - 1, B - 2, C - 3, D - 4"
            },
            {
              "id": "c",
              "text": "A - 3, B - 4, C - 2, D - 1"
            },
            {
              "id": "d",
              "text": "A - 1, B - 4, C - 3, D - 2"
            }
          ],
          "correctAnswer": "a",
          "explanation": "सही मिलान है:
a. स्थिर स्थल - 3. मरें
b. हिम नियंत्रण - 4. डेली
c. निम्मज्जन - 1. डार्विन
d. अपरदन - 2. आगासीज, (add more explanation for this here, this is not enough)" 
        },
        {
          "id": "q2",
          "type": "MCQ",
          "text": "प्रश्न 5
निम्नलिखित कथनों पर विचार कीजिए:
1. लक्षद्वीप के महाद्वीपीय शेल्फ प्रवाल भितियों के कारण उत्पन्न हुए
2. भारत पश्चिमी तट के महाद्वीपीय शेल्फ भ्रंशन और निमज्जन के कारण बने है
उपर्युक्त कथनों में से कौनसे कथन सत्य है? ![image example](data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAXoAAAFMC....(saving context tokens)...QmCC))",
          "choices": [
            {
              "id": "a",
              "text": "केवल 1"
            },
            {
              "id": "b",
              "text": "केवल 2"
            },
            {
              "id": "c",
              "text": "1 व 2 दोनों"
            },
            {
              "id": "d",
              "text": "न तो 1 और न ही 2"
            }
          ],
          "correctAnswer": "c",
          "explanation": "दोनों कथन सत्य हैं। लक्षद्वीप महाद्वीपीय शेल्फ प्रवाल भित्तियों से बने हैं और भारत का पश्चिमी तट महाद्वीपीय शेल्फ भ्रंशन और निमज्जन के कारण बना है।"
        }
      ],
      "settings": {
        "timeLimit": 10800,
        "shuffleQuestions": false
      }
    } 
      
    DO NOT PROVIDE RESPONSE IN CODE BLOCKS`;
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
        <h1 className="text-3xl font-bold">Howdy, User!</h1>
        <div className="flex items-center gap-4" role="toolbar" aria-label="Main actions">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" aria-label="Copy quiz format prompt">
                <Copy className="h-4 w-4 mr-2" aria-hidden="true" />
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
                      onClick={() => copyCodeToClipboard(JSON.stringify({
                        "id": "unique_id",
                        "title": "Quiz Title",
                        "description": "A detailed description of your quiz that supports **markdown**",
                        "questions": [
                          {
                            "id": "q1",
                            "type": "MCQ",
                            "text": "# Main Question\n\nWhat is the output of this code?\n\n```python\ndef example():\n    return 42\n```\n\nChoose the correct answer:",
                            "choices": [
                              {
                                "id": "a",
                                "text": "42"
                              },
                              {
                                "id": "b",
                                "text": "None"
                              },
                              {
                                "id": "c",
                                "text": "An error"
                              },
                              {
                                "id": "d",
                                "text": "undefined"
                              }
                            ],
                            "correctAnswer": "a",
                            "explanation": "The function example() explicitly returns the number 42. In Python, this is a valid return statement."
                          }
                        ],
                        "settings": {
                          "timeLimit": 600,
                          "shuffleQuestions": false
                        }
                      }, null, 2))}
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

          <Button onClick={handleCreateQuiz} aria-label="Create new quiz">
            <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
            Create Quiz
          </Button>
          <ThemeToggle />
        </div>
      </div>

      <div className="flex gap-4 items-center mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" aria-hidden="true" />
          <Input
            type="text"
            placeholder="Search quizzes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            aria-label="Search quizzes"
          />
        </div>
        <Select
          value={sortOrder}
          onValueChange={(value: "asc" | "desc") => setSortOrder(value)}
          aria-label="Sort order"
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort order" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">Title (A-Z)</SelectItem>
            <SelectItem value="desc">Title (Z-A)</SelectItem>
          </SelectContent>
        </Select>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" aria-label="Clear all quiz data">Clear All Data</Button>
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

      <div className="space-y-4">
        {filteredQuizzes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No quizzes found</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredQuizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="bg-card p-6 rounded-lg shadow-sm border border-border relative group"
                role="article"
                aria-labelledby={`quiz-title-${quiz.id}`}
              >
                <div className="absolute top-4 right-4 flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleJsonEdit(quiz)}
                    aria-label={`Edit ${quiz.title} in JSON format`}
                  >
                    <Code className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleEditQuiz(quiz)}
                    aria-label={`Edit ${quiz.title}`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                      aria-hidden="true"
                    >
                      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                      <path d="m15 5 4 4" />
                    </svg>
                  </Button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h2 id={`quiz-title-${quiz.id}`} className="text-xl font-semibold tracking-tight line-clamp-1">{quiz.title}</h2>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2" id={`quiz-desc-${quiz.id}`}>{quiz.description}</p>
                  </div>

                  <div className="flex items-center gap-2" role="group" aria-label="Quiz actions">
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate(`/quiz/${quiz.id}`)}
                      aria-label={`Start ${quiz.title} quiz`}
                    >
                      Start Quiz
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleClearSaves(quiz.id)}
                      aria-label={`Clear saved progress for ${quiz.title}`}
                    >
                      <Eraser className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive/90"
                          aria-label={`Delete ${quiz.title}`}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-4 w-4"
                            aria-hidden="true"
                          >
                            <path d="M3 6h18" />
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                          </svg>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Quiz</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete {quiz.title}? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(quiz.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
