import { useState } from "react";
import { Quiz } from "@/types/quiz";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import Markdown from "react-markdown";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface JsonQuizCreatorProps {
  onQuizCreate: (quiz: Quiz) => void;
}

const sampleQuizFormat = {
  id: "unique_id",
  title: "Quiz Title",
  description: "A detailed description of your quiz that supports **markdown**",
  questions: [
    {
      id: "q1",
      type: "MCQ",
      text: "# Main Question\n\nWhat is the output of this code?\n\n```python\ndef example():\n    return 42\n```\n\nChoose the correct answer:",
      choices: [
        { id: "a", text: "`42`" },
        { id: "b", text: "`None`" },
        { id: "c", text: "An error" },
        { id: "d", text: "`undefined`" },
      ],
      correctAnswer: "a",
      explanation: "The function `example()` explicitly returns the number `42`. In Python, this is a valid return statement.",
    }
  ],
  settings: {
    timeLimit: 600,
    shuffleQuestions: false
  }
};

const markdownExample = `
# Markdown Support

Your questions can include rich formatting:

## Text Formatting
- **Bold text**
- *Italic text*
- ~~Strikethrough~~

## Code Blocks
\`\`\`javascript
function example() {
  return "Hello World";
}
\`\`\`

## Lists
1. Ordered items
2. Like this

- Unordered items
- Like this

## Tables
| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |

## Links and Images
[Link text](https://example.com)
![Image alt text](https://example.com/image.jpg)

## Blockquotes
> This is a blockquote
`;

export function JsonQuizCreator({ onQuizCreate }: JsonQuizCreatorProps) {
  const [jsonInput, setJsonInput] = useState("");
  const { toast } = useToast();

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

  const handleCreateQuiz = () => {
    try {
      const parsedQuiz = JSON.parse(jsonInput);
      if (validateQuiz(parsedQuiz)) {
        onQuizCreate(parsedQuiz);
        toast({
          title: "Success",
          description: "Quiz created successfully!",
          variant: "default",
        });
        setJsonInput("");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Invalid JSON format",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Create Quiz from JSON</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Format Guide</Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Quiz JSON Format Guide</DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="format" className="w-full">
              <TabsList>
                <TabsTrigger value="format">JSON Format</TabsTrigger>
                <TabsTrigger value="markdown">Markdown Guide</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>
              
              <TabsContent value="format" className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">JSON Structure:</h3>
                  <pre className="p-4 bg-muted rounded-lg overflow-x-auto">
                    {JSON.stringify(sampleQuizFormat, null, 2)}
                  </pre>
                  <div className="space-y-2">
                    <h3 className="font-semibold">Requirements:</h3>
                    <ul className="list-disc list-inside space-y-1">
                      <li>All IDs must be unique strings</li>
                      <li>Questions must be of type "MCQ"</li>
                      <li>Each question must have exactly 4 choices</li>
                      <li>Each choice must have an ID and text</li>
                      <li>correctAnswer must match one of the choice IDs</li>
                      <li>timeLimit must be a positive number (in seconds)</li>
                      <li>shuffleQuestions must be a boolean</li>
                      <li>Question text, choices, and explanations support markdown</li>
                    </ul>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="markdown" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold">Markdown Syntax:</h3>
                    <pre className="p-4 bg-muted rounded-lg overflow-x-auto whitespace-pre-wrap">
                      {markdownExample}
                    </pre>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold">Preview:</h3>
                    <div className="p-4 bg-muted rounded-lg overflow-x-auto prose dark:prose-invert max-w-none">
                      <Markdown>{markdownExample}</Markdown>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="preview" className="space-y-4">
                <div className="space-y-4">
                  <h3 className="font-semibold">Sample Question Preview:</h3>
                  <div className="p-4 bg-muted rounded-lg prose dark:prose-invert max-w-none">
                    <Markdown>{sampleQuizFormat.questions[0].text}</Markdown>
                    <div className="space-y-2">
                      {sampleQuizFormat.questions[0].choices.map((choice) => (
                        <div key={choice.id} className="flex items-start space-x-2">
                          <div className="font-semibold">{choice.id}.</div>
                          <div><Markdown>{choice.text}</Markdown></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>
      <Textarea
        value={jsonInput}
        onChange={(e) => setJsonInput(e.target.value)}
        placeholder="Paste your quiz JSON here..."
        className="min-h-[400px] font-mono"
      />
      <Button onClick={handleCreateQuiz} className="w-full">
        Create Quiz
      </Button>
    </div>
  );
}
