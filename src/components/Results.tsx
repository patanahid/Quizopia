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
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const [negativeMarks, setNegativeMarks] = useState(0);

  if (!state) return null;

  const calculateScore = () => {
    let score = 0;
    quiz.questions.forEach((question) => {
      const userAnswer = state.answers[question.id];
      if (!userAnswer) return; // No negative marking for unattempted questions
      if (userAnswer === question.correctAnswer) {
        score += 1;
      } else {
        score -= negativeMarks;
      }
    });
    return Math.max(0, score); // Ensure score doesn't go below 0
  };

  const score = calculateScore();
  const totalQuestions = quiz.questions.length;
  const attemptedQuestions = Object.keys(state.answers).length;
  const correctAnswers = quiz.questions.reduce((count, question) => 
    state.answers[question.id] === question.correctAnswer ? count + 1 : count, 0);
  const wrongAnswers = attemptedQuestions - correctAnswers;
  const percentage = Math.round((score / totalQuestions) * 100);
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
        <div className="space-y-6">
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <Label htmlFor="negative-marks">Negative Marks per Wrong Answer</Label>
              <Input
                id="negative-marks"
                type="number"
                min="0"
                max="1"
                step="0.25"
                value={negativeMarks}
                onChange={(e) => setNegativeMarks(Number(e.target.value))}
                className="max-w-[200px]"
              />
            </div>
            <Button variant="outline" onClick={() => setNegativeMarks(0)}>Reset</Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Score</h3>
              <div>
                <p className="text-2xl font-bold text-foreground">{score.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">({percentage}%)</p>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Correct Answers</h3>
              <div>
                <p className="text-2xl font-bold text-foreground">{correctAnswers}</p>
                <p className="text-sm text-muted-foreground">+{correctAnswers} marks</p>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Wrong Answers</h3>
              <div>
                <p className="text-2xl font-bold text-foreground">{wrongAnswers}</p>
                <p className="text-sm text-muted-foreground">
                  {negativeMarks > 0 ? `-${(wrongAnswers * negativeMarks).toFixed(2)} marks` : "no penalty"}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Not Attempted</h3>
              <div>
                <p className="text-2xl font-bold text-foreground">{totalQuestions - attemptedQuestions}</p>
                <p className="text-sm text-muted-foreground">no penalty</p>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="text-sm text-muted-foreground">
              Scoring: +1 for correct, -{negativeMarks} for wrong, 0 for not attempted
            </div>
            <div className="text-sm text-muted-foreground">
              Time Taken: {formatTime(timeTaken)}
            </div>
          </div>
        </div>
      </Card>

      <div className="space-y-6">
        {quiz.questions.map((question, index) => {
          const userAnswer = state.answers[question.id];
          const isCorrect = userAnswer === question.correctAnswer;
          const selectedAnswer = question.choices?.find(
            (choice) => choice.id === userAnswer
          );
          const correctAnswerText = question.choices?.find(
            (choice) => choice.id === question.correctAnswer
          )?.text;

          return (
            <Card key={question.id} className="p-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {userAnswer ? (
                      isCorrect ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="prose dark:prose-invert max-w-none mb-4">
                      <Markdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeRaw]}
                        components={markdownComponents}
                      >
                        {`${index + 1}. ${question.text}`}
                      </Markdown>
                    </div>

                    {userAnswer && (
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">Your answer:</div>
                        <div className={cn(
                          "prose dark:prose-invert max-w-none p-3 rounded-lg",
                          isCorrect ? "bg-green-500/10" : "bg-red-500/10"
                        )}>
                          <Markdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeRaw]}
                            components={markdownComponents}
                          >
                            {selectedAnswer?.text}
                          </Markdown>
                        </div>
                      </div>
                    )}

                    {!isCorrect && (
                      <div className="space-y-2 mt-4">
                        <div className="text-sm text-muted-foreground">Correct answer:</div>
                        <div className="prose dark:prose-invert max-w-none p-3 rounded-lg bg-green-500/10">
                          <Markdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeRaw]}
                            components={markdownComponents}
                          >
                            {correctAnswerText}
                          </Markdown>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="flex gap-4">
        <Button onClick={onRetry}>Try Again</Button>
        <Button variant="outline" onClick={() => navigate("/")}>
          Back to Home
        </Button>
      </div>
    </div>
  );
}
