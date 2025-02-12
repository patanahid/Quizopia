import { Quiz, QuizState } from "@/types/quiz";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, XCircle } from "lucide-react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import type { Components } from "react-markdown";
import { cn } from "@/lib/utils";

const markdownComponents: Components = {
  pre: ({ children }) => (
    <pre className="p-4 bg-muted rounded-lg overflow-x-auto">
      {children}
    </pre>
  ),
  code: ({ className, children, ...props }) => {
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

interface ResultsProps {
  quiz: Quiz;
  state: QuizState;
  onRetry: () => void;
}

export function Results({ quiz, state, onRetry }: ResultsProps) {
  const navigate = useNavigate();

  if (!state) return null;

  const calculateScore = () => {
    return quiz.questions.reduce((score, question, index) => {
      const userAnswer = state.answers[question.id];
      if (!userAnswer) return score;
      return userAnswer === question.correctAnswer ? score + 1 : score;
    }, 0);
  };

  const score = calculateScore();
  const percentage = Math.round((score / quiz.questions.length) * 100);
  const timeTaken = quiz.settings.timeLimit - state.timeRemaining;

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    const parts = [];
    if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
    if (minutes > 0 || hours > 0) parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
    if (remainingSeconds > 0 || (hours === 0 && minutes === 0)) {
      parts.push(`${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}`);
    }
    
    return parts.join(', ');
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl space-y-8 animate-fade-in">
      <Card className="p-6 bg-card text-card-foreground">
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Score</h3>
            <p className="text-2xl font-bold text-foreground">{percentage}%</p>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Correct Answers
            </h3>
            <p className="text-2xl font-bold text-foreground">
              {score} / {quiz.questions.length}
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Time Taken
            </h3>
            <p className="text-2xl font-bold text-foreground">{formatTime(timeTaken)}</p>
          </div>
        </div>
      </Card>

      <div className="space-y-6">
        {quiz.questions.map((question, index) => {
          const isCorrect = state.answers[question.id] === question.correctAnswer;
          const selectedAnswer = question.choices?.find(
            (choice) => choice.id === state.answers[question.id]
          );
          const correctAnswer = question.choices?.find(
            (choice) => choice.id === question.correctAnswer
          );

          return (
            <Card key={question.id} className="p-6 bg-card text-card-foreground">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground">
                    Question {index + 1}
                  </h3>
                  <div className="flex items-center space-x-2">
                    {isCorrect ? (
                      <div className="flex items-center text-green-500 dark:text-green-400">
                        <CheckCircle2 className="h-5 w-5 mr-1" />
                        <span className="text-sm font-medium">Correct</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-destructive">
                        <XCircle className="h-5 w-5 mr-1" />
                        <span className="text-sm font-medium">Incorrect</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="prose dark:prose-invert max-w-none">
                  <Markdown 
                    remarkPlugins={[remarkGfm]} 
                    rehypePlugins={[rehypeRaw]}
                    components={markdownComponents}
                  >
                    {question.text}
                  </Markdown>
                </div>

                <div className="space-y-3">
                  {question.choices.map((choice, choiceIndex) => {
                    const isSelected = state.answers[question.id] === choice.id;
                    const isCorrectChoice = choice.id === question.correctAnswer;
                    const choiceLabel = String.fromCharCode(65 + choiceIndex); // Convert 0 -> A, 1 -> B, etc.
                    
                    return (
                      <div
                        key={choice.id}
                        className={cn(
                          "p-4 rounded-lg border transition-colors",
                          {
                            "border-green-500 bg-green-50 dark:bg-green-900/20": isCorrectChoice,
                            "border-destructive bg-destructive/10": isSelected && !isCorrectChoice,
                            "hover:bg-accent/10": !isSelected && !isCorrectChoice,
                          }
                        )}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-foreground min-w-[1.5rem]">
                              {choiceLabel})
                            </span>
                          </div>
                          <div className="prose dark:prose-invert flex-1">
                            <Markdown 
                              remarkPlugins={[remarkGfm]} 
                              rehypePlugins={[rehypeRaw]}
                              components={markdownComponents}
                            >
                              {choice.text}
                            </Markdown>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {question.explanation && (
                  <div className="mt-4 p-4 rounded-lg bg-muted text-muted-foreground border">
                    <h4 className="font-semibold mb-2 text-foreground">Explanation:</h4>
                    <div className="prose dark:prose-invert">
                      <Markdown 
                        remarkPlugins={[remarkGfm]} 
                        rehypePlugins={[rehypeRaw]}
                        components={markdownComponents}
                      >
                        {question.explanation}
                      </Markdown>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-center gap-4">
        <Button onClick={onRetry} variant="outline">Retry Quiz</Button>
        <Button onClick={() => navigate("/")}>Back to Home</Button>
      </div>
    </div>
  );
}
