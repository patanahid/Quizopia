import { useState } from "react";
import { Header } from "@/components/Header";
import { EditQuiz } from "@/components/EditQuiz";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { sampleQuiz } from "@/data/sample-quiz";
import { JsonQuizCreator } from "@/components/JsonQuizCreator";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { FileUp, Pencil, Code } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Quiz } from "@/types/quiz";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";

export default function CreateQuiz() {
  const [storedQuizzes, setStoredQuizzes] = useLocalStorage("quizzes", [sampleQuiz]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const navigate = useNavigate();

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

  const handleJsonQuizCreate = (quiz: Quiz) => {
    const newQuiz = {
      ...quiz,
      id: uuidv4(),
    };
    setStoredQuizzes([...storedQuizzes, newQuiz]);
    toast.success("Quiz created successfully");
    navigate("/");
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const quiz = JSON.parse(content);
        
        // Basic validation
        if (!quiz.title || !quiz.questions || !Array.isArray(quiz.questions)) {
          toast.error("Invalid quiz format");
          return;
        }
        
        const newQuiz = {
          ...quiz,
          id: uuidv4(),
        };
        
        setStoredQuizzes([...storedQuizzes, newQuiz]);
        toast.success("Quiz imported successfully");
        navigate("/");
      } catch (error) {
        toast.error("Failed to parse JSON file");
      }
    };
    reader.readAsText(file);
  };

  // If no method is selected, show the selection cards
  if (!activeTab) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-6">
          <h1 className="text-3xl font-bold mb-6">Create Quiz</h1>
          <p className="text-muted-foreground mb-8">Choose a method to create your quiz:</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card 
              className="p-6 cursor-pointer hover:border-primary transition-colors"
              onClick={() => setActiveTab("ui-create")}
            >
              <div className="flex flex-col items-center text-center">
                <Pencil className="h-12 w-12 mb-4 text-primary" />
                <h2 className="text-xl font-semibold mb-2">UI Creator</h2>
                <p className="text-muted-foreground mb-4">
                  Create a quiz using our interactive form builder with a user-friendly interface.
                </p>
                <Button className="w-full">Select</Button>
              </div>
            </Card>
            
            <Card 
              className="p-6 cursor-pointer hover:border-primary transition-colors"
              onClick={() => setActiveTab("json-paste")}
            >
              <div className="flex flex-col items-center text-center">
                <Code className="h-12 w-12 mb-4 text-primary" />
                <h2 className="text-xl font-semibold mb-2">JSON Paste</h2>
                <p className="text-muted-foreground mb-4">
                  Paste JSON data to quickly create a quiz from existing content or templates.
                </p>
                <Button className="w-full">Select</Button>
              </div>
            </Card>
            
            <Card 
              className="p-6 cursor-pointer hover:border-primary transition-colors"
              onClick={() => setActiveTab("json-file")}
            >
              <div className="flex flex-col items-center text-center">
                <FileUp className="h-12 w-12 mb-4 text-primary" />
                <h2 className="text-xl font-semibold mb-2">JSON File</h2>
                <p className="text-muted-foreground mb-4">
                  Upload a JSON file containing your quiz data to import it directly.
                </p>
                <Button className="w-full">Select</Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Create Quiz</h1>
          <Button variant="outline" onClick={() => setActiveTab(null)}>
            Change Method
          </Button>
        </div>
        
        {activeTab === "ui-create" && (
          <EditQuiz
            quizzes={storedQuizzes}
            setQuizzes={setStoredQuizzes}
            editQuiz={emptyQuiz}
          />
        )}
        
        {activeTab === "json-paste" && (
          <JsonQuizCreator onQuizCreate={handleJsonQuizCreate} />
        )}
        
        {activeTab === "json-file" && (
          <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-border rounded-lg">
            <FileUp className="h-12 w-12 mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Upload JSON File</h2>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              Upload a JSON file containing your quiz data. The file should follow the Quizopia quiz format.
            </p>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
              id="json-file-input"
            />
            <label htmlFor="json-file-input">
              <Button className="cursor-pointer">
                Choose File
              </Button>
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
