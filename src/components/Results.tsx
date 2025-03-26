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
import { useState, useEffect } from "react";
import { CodeBlock } from "@/components/ui/code-block";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { extractBase64Images, getImageSrc } from "@/utils/imageUtils";

type FilterType = "all" | "correct" | "incorrect" | "marked" | "not-attempted";

// Create a custom hook to handle extracting images
function useExtractedImages(text: string) {
  const [processedData, setProcessedData] = useState<{
    text: string;
    images: Record<string, string>;
  }>({ text: "", images: {} });

  useEffect(() => {
    const extracted = extractBase64Images(text);
    setProcessedData(extracted);
  }, [text]);

  return processedData;
}

// Function to create markdown components with extracted images
const createMarkdownComponents = (images: Record<string, string>): Components => ({
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
  img: ({ src, alt, ...props }) => {
    // Use the utility function to get the actual image source
    const actualSrc = getImageSrc(src, images);
    
    return (
      <img 
        src={actualSrc} 
        alt={alt || "Quiz image"} 
        className="max-w-full rounded-md my-3"
        style={{ maxHeight: "500px" }}
        loading="lazy"
        {...props}
      />
    );
  },
});

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

  return (
    <div className="container mx-auto p-4 max-w-4xl space-y-6 animate-fade-in">
      {/* Summary Card */}
      <Card className="p-6 bg-card text-card-foreground">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Score Section */}
          <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-primary/5 border border-primary/10">
            <h3 className="text-base font-medium text-primary mb-3">Final Score</h3>
            <div className="flex items-baseline gap-2">
              <p className={`text-4xl font-bold ${percentage >= 60 ? 'text-green-500' : 'text-red-500'}`}>
                {percentage.toFixed(1)}%
              </p>
              <p className="text-lg text-muted-foreground">
                ({scoreDetails.totalScore.toFixed(1)} / {quiz.questions.length})
              </p>
            </div>
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-1.5 text-green-500">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm">{scoreDetails.correctAnswers}</span>
              </div>
              <div className="flex items-center gap-1.5 text-red-500">
                <XCircle className="w-4 h-4" />
                <span className="text-sm">{scoreDetails.wrongAnswers}</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <HelpCircle className="w-4 h-4" />
                <span className="text-sm">{scoreDetails.notAttempted}</span>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="flex flex-col gap-3">
            <div className="p-3 rounded-lg bg-muted/50">
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Time Taken</h4>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <p className="text-lg font-medium">{formatTime(timeTaken)}</p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-muted/50">
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Marks Breakdown</h4>
              <div className="space-y-1">
                <div className="flex justify-between items-center text-sm text-green-500">
                  <span>Marks Gained</span>
                  <span className="font-medium">+{scoreDetails.marksGained}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-red-500">
                  <span>Marks Deducted</span>
                  <span className="font-medium">-{scoreDetails.marksDeducted}</span>
                </div>
                <div className="flex justify-between items-center text-sm pt-1 border-t">
                  <span className="font-medium">Net Score</span>
                  <span className="font-medium">{scoreDetails.totalScore.toFixed(1)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Questions Section */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">
          Questions ({filteredQuestions.length} of {quiz.questions.length})
        </h2>
        <Select
          value={filter}
          onValueChange={(value: FilterType) => setFilter(value)}
        >
          <SelectTrigger className="w-[160px]">
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

      <div className="space-y-4">
        {filteredQuestions.map((question) => {
          const isCorrect = state.answers[question.id] === question.correctAnswer;
          const isMarked = state.markedForReview?.includes(question.id);
          const originalIndex = quiz.questions.findIndex(q => q.id === question.id);
          
          // Extract base64 images from question text
          const questionData = useExtractedImages(question.text);
          const questionMarkdownComponents = createMarkdownComponents(questionData.images);

          return (
            <Card key={question.id} className="p-4 bg-card text-card-foreground">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-medium">
                      Question {originalIndex + 1}
                    </h3>
                    {isMarked && (
                      <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 px-2 py-0.5 rounded-full">
                        Marked for Review
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {state.answers[question.id] && state.answers[question.id].length > 0 ? (
                      isCorrect ? (
                        <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full">
                          Correct
                        </span>
                      ) : (
                        <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full">
                          Incorrect
                        </span>
                      )
                    ) : (
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                        Not Attempted
                      </span>
                    )}
                  </div>
                </div>

                <div className="prose dark:prose-invert max-w-none prose-sm">
                  <Markdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                    components={questionMarkdownComponents}
                  >
                    {questionData.text}
                  </Markdown>
                </div>

                <div className="space-y-2">
                  {question.choices.map((choice, choiceIndex) => {
                    const isSelected = state.answers[question.id] === choice.id;
                    const isCorrectChoice = choice.id === question.correctAnswer;
                    const choiceLabel = String.fromCharCode(65 + choiceIndex);
                    
                    // Extract base64 images from choice text
                    const choiceData = useExtractedImages(choice.text);
                    const choiceMarkdownComponents = createMarkdownComponents(choiceData.images);

                    return (
                      <div
                        key={choice.id}
                        className={cn(
                          "flex items-start gap-2 p-2 rounded-md border text-sm",
                          {
                            "border-green-500 bg-green-50 dark:bg-green-900/20": isCorrectChoice,
                            "border-destructive bg-destructive/10": isSelected && !isCorrectChoice,
                            "hover:bg-muted/50": !isSelected && !isCorrectChoice,
                          }
                        )}
                      >
                        <span className="font-medium text-muted-foreground min-w-[1.5rem]">
                          {choiceLabel})
                        </span>
                        <div className="prose dark:prose-invert prose-sm flex-1">
                          <Markdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeRaw]}
                            components={choiceMarkdownComponents}
                          >
                            {choiceData.text}
                          </Markdown>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {question.explanation && (
                  <div className="mt-3 p-3 rounded-md bg-muted/50 text-sm">
                    <h4 className="font-medium mb-1">Explanation:</h4>
                    <div className="prose dark:prose-invert prose-sm">
                      {/* Extract base64 images from explanation text */}
                      {(() => {
                        const explanationData = useExtractedImages(question.explanation);
                        const explanationMarkdownComponents = createMarkdownComponents(explanationData.images);
                        
                        return (
                          <Markdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeRaw]}
                            components={explanationMarkdownComponents}
                          >
                            {explanationData.text}
                          </Markdown>
                        );
                      })()}
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

      <div className="flex justify-center gap-4 pt-4">
        <Button onClick={onRetry} variant="outline">Retry Quiz</Button>
        <Button onClick={() => navigate("/")}>Back to Home</Button>
      </div>
    </div>
  );
}
