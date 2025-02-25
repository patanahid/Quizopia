import { Quiz, QuizState } from "@/types/quiz";
import { Header } from "@/components/Header";
import { MessageCircleQuestion } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  XCircle,
  BookmarkCheck,
  Clock,
  HelpCircle,
  BarChart,
  Trash2
} from "lucide-react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import type { Components } from "react-markdown";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { CodeBlock } from "@/components/ui/code-block";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type FilterType = "all" | "correct" | "incorrect" | "marked" | "not-attempted";

interface ResultsProps {
  quiz: Quiz;
  state: QuizState;
  onRetry: () => void;
}

export function Results({ quiz, state, onRetry }: ResultsProps) {
  const navigate = useNavigate();
  const [negativeMarks, setNegativeMarks] = useState(0);
  const [filter, setFilter] = useState<FilterType>("all");

  if (!quiz || !state) {
    return (
      <div className="text-center p-4">
        <p className="text-muted-foreground">No quiz data available</p>
      </div>
    );
  }

  const calculateScore = () => {
    let totalScore = 0;
    let correctAnswers = 0;
    let wrongAnswers = 0;
    let notAttempted = 0;

    quiz.questions.forEach((question) => {
      const userAnswer = state.answers[question.id];
      // Check if the answer exists and is not an empty string
      if (!userAnswer || userAnswer.length === 0) {
        notAttempted++;
      } else if (userAnswer === question.correctAnswer) {
        correctAnswers++;
        totalScore += 1;
      } else {
        wrongAnswers++;
        totalScore -= negativeMarks;
      }
    });

    return {
      totalScore: Math.max(0, totalScore),
      correctAnswers,
      wrongAnswers,
      notAttempted,
      marksGained: correctAnswers,
      marksDeducted: wrongAnswers * negativeMarks
    };
  };

  const scoreDetails = calculateScore();
  const percentage = Math.round((scoreDetails.totalScore / quiz.questions.length) * 100);
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

  const results = {
    scoreDetails,
    percentage,
    timeTaken
  };

  const filterQuestions = () => {
    return quiz.questions.filter((question) => {
      const isCorrect = state.answers[question.id] === question.correctAnswer;
      const isMarked = state.markedForReview?.includes(question.id);
      const isAttempted = state.answers[question.id] && state.answers[question.id].length > 0;

      switch (filter) {
        case "correct":
          return isCorrect;
        case "incorrect":
          return !isCorrect && isAttempted;
        case "marked":
          return isMarked;
        case "not-attempted":
          return !isAttempted;
        default:
          return true;
      }
    });
  };


  const filteredQuestions = filterQuestions();

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
          className={`${className} ${isInline ? "bg-muted px-1 py-0.5 rounded" : ""
            }`}
          {...props}
        >
          {children}
        </code>
      );
    },
  };

  return (
    <>
      <Header />
      <div className="container mx-auto p-4 max-w-4xl space-y-8 animate-fade-in">
        <Card className="p-6 bg-card text-card-foreground">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Score Section */}
            <div className="flex flex-col items-center justify-center p-6 rounded-lg bg-primary/5 border-2 border-primary/10">
              <h3 className="text-lg font-medium text-primary mb-2">Final Score</h3>
              <div className="flex items-baseline gap-2">
                <p className={`text-5xl font-bold ${percentage >= 60 ? 'text-green-500' : 'text-red-500'}`}>
                  {percentage.toFixed(1)}%
                </p>
                <p className="text-xl text-muted-foreground">
                  ({scoreDetails.totalScore.toFixed(1)} / {quiz.questions.length})
                </p>
              </div>
              <div className="flex items-center gap-6 mt-6">
                <div className="flex items-center gap-2 text-green-500">
                  <CheckCircle2 className="w-5 h-5" />
                  <div className="text-center">
                    <p className="text-xl font-bold">{scoreDetails.correctAnswers}</p>
                    <p className="text-xs text-muted-foreground">Correct</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-red-500">
                  <XCircle className="w-5 h-5" />
                  <div className="text-center">
                    <p className="text-xl font-bold">{scoreDetails.wrongAnswers}</p>
                    <p className="text-xs text-muted-foreground">Wrong</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <HelpCircle className="w-5 h-5" />
                  <div className="text-center">
                    <p className="text-xl font-bold">{scoreDetails.notAttempted}</p>
                    <p className="text-xs">Not Attempted</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Section */}
            <div className="flex flex-col gap-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Time Statistics</h4>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-500" />
                  <p className="text-2xl font-bold text-foreground">{formatTime(timeTaken)}</p>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Marks Breakdown</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-green-500">
                    <span>Marks Gained</span>
                    <span className="font-bold">+{scoreDetails.marksGained}</span>
                  </div>
                  <div className="flex justify-between items-center text-red-500">
                    <span>Marks Deducted</span>
                    <span className="font-bold">-{scoreDetails.marksDeducted}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="font-medium">Net Score</span>
                    <span className="font-bold">{scoreDetails.totalScore.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t">
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Negative Marking (per wrong answer)
            </label>
            <input
              type="number"
              min="0"
              max="1"
              step="0.25"
              value={negativeMarks}
              onChange={(e) => setNegativeMarks(Number(e.target.value))}
              className="w-24 px-3 py-1.5 border rounded-md"
            />
            <Button
            className="m-1"
              variant="outline"
              size="icon" onClick={() => setNegativeMarks(Number(1/3))}>1/3</Button>
          </div>
        </Card>

        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">
            Questions ({filteredQuestions.length} of {quiz.questions.length})
          </h2>
          <div className="flex items-center gap-4">
            <Select
              value={filter}
              onValueChange={(value: FilterType) => setFilter(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter questions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Questions</SelectItem>
                <SelectItem value="correct">Correct Only</SelectItem>
                <SelectItem value="incorrect">Incorrect Only</SelectItem>
                <SelectItem value="marked">Marked for Review</SelectItem>
                <SelectItem value="not-attempted">Not Attempted</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-6">
          {filteredQuestions.map((question) => {
            const isCorrect = state.answers[question.id] === question.correctAnswer;
            const selectedAnswer = question.choices?.find(
              (choice) => choice.id === state.answers[question.id]
            );
            const correctAnswer = question.choices?.find(
              (choice) => choice.id === question.correctAnswer
            );
            const isMarked = state.markedForReview?.includes(question.id);
            const originalIndex = quiz.questions.findIndex(q => q.id === question.id);

            return (
              <Card key={question.id} className="p-6 bg-card text-card-foreground">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-foreground">
                      Question {originalIndex + 1}
                    </h3>
                    <div className="flex items-center gap-4">
                      {isMarked && (
                        <div className="flex items-center text-yellow-500">
                          <BookmarkCheck className="h-5 w-5 mr-1" />
                          <span className="text-sm font-medium">Marked for Review</span>
                        </div>
                      )}
                      {state.answers[question.id] && state.answers[question.id].length > 0 ? (
                        isCorrect ? (
                          <div className="flex items-center text-green-500 dark:text-green-400">
                            <CheckCircle2 className="h-5 w-5 mr-1" />
                            <span className="text-sm font-medium">Correct</span>
                          </div>
                        ) : (
                          <div className="flex items-center text-destructive">
                            <XCircle className="h-5 w-5 mr-1" />
                            <span className="text-sm font-medium">Incorrect</span>
                          </div>
                        )
                      ) : (
                        <div className="flex items-center text-muted-foreground">
                          <span className="text-sm font-medium">Not Attempted</span>
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
                            "p-2 sm:p-3 rounded-lg border transition-colors",
                            {
                              "border-green-500 bg-green-50 dark:bg-green-900/20": isCorrectChoice,
                              "border-destructive bg-destructive/10": isSelected && !isCorrectChoice,
                              "hover:bg-accent/10": !isSelected && !isCorrectChoice,
                            }
                          )}
                        >
                          <div className="flex items-start space-x-2 sm:space-x-3">
                            <div className="flex items-center space-x-1 sm:space-x-2">
                              <span className="font-medium text-foreground min-w-[1.25rem] sm:min-w-[1.5rem]">
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

        {filteredQuestions.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No questions match the selected filter
          </div>
        )}

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Results JSON:</h3>
          <CodeBlock
            code={JSON.stringify(results, null, 2)}
            language="json"
          />
        </div>

        <div className="flex justify-center gap-4 mb-8">
          <Button onClick={onRetry} variant="outline">Retry Quiz</Button>
          <Button onClick={() => navigate("/")}>Back to Home</Button>
        </div>
      </div>

      <footer className="border-t py-6 mt-8">
        <div className="container flex items-center justify-center gap-2 text-muted-foreground">
          <MessageCircleQuestion className="h-5 w-5" />
          <p className="text-sm">Quizopia - Test your knowledge</p>
        </div>
      </footer>
    </>
  );
}
