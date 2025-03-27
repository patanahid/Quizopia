import { useState, useEffect } from "react";
import { useQuizResults } from "@/hooks/useQuizResults";
import { Header } from "@/components/Header";
import { useNavigate, useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Results as QuizResults } from "@/components/Results";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  CheckCircle2,
  Clock,
  XCircle,
  HelpCircle,
  Trash2,
} from "lucide-react";
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

type SortOption = "date" | "score" | "title";
type FilterOption = "all" | "passed" | "failed";

export default function Results() {
  const { resultId } = useParams();
  const navigate = useNavigate();
  const { getAllResults, getResult, deleteResult, saveResult } = useQuizResults();
  const [sort, setSort] = useState<SortOption>("date");
  const [filter, setFilter] = useState<FilterOption>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedResult, setSelectedResult] = useState<string | null>(null);

  // Delete handling
  const handleDeleteResult = (id: string) => {
    setSelectedResult(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (selectedResult) {
      deleteResult(selectedResult);
      setShowDeleteConfirm(false);
      setSelectedResult(null);
      // If we're on the specific result page, navigate back
      if (resultId === selectedResult) {
        navigate('/results');
      }
    }
  };

  // Get all results
  const allResults = getAllResults() || [];

  // Load results and handle specific result
  useEffect(() => {
    const loadResults = async () => {
      try {
        console.log('Loading results - resultId:', resultId);
        
        // Check localStorage first
        const savedResults = JSON.parse(localStorage.getItem('quiz-results') || '[]');
        console.log('Results in localStorage:', savedResults);

        // If looking for a specific result
        if (resultId) {
          // Find in localStorage first
          const savedResult = savedResults.find(r => r.id === resultId);
          console.log('Found in localStorage:', savedResult);

          if (!savedResult) {
            throw new Error('Result not found');
          }

          // Add all results to state
          savedResults.forEach(result => {
            if (!getResult(result.id)) {
              saveResult(result.quizSnapshot, result.state);
            }
          });

          // Wait for state to update
          await new Promise(resolve => setTimeout(resolve, 500));

          // Verify the result is in state
          const stateResult = getResult(resultId);
          if (!stateResult) {
            throw new Error('Failed to load result');
          }
        } else {
          // Just load all results
          savedResults.forEach(result => {
            if (!getResult(result.id)) {
              saveResult(result.quizSnapshot, result.state);
            }
          });
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Error loading results:', err);
        setError(err.message || 'Failed to load results');
        setIsLoading(false);
      }
    };

    loadResults();
  }, [resultId, getResult, saveResult]);

  // Loading state
  if (isLoading && resultId) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-6">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Loading Results...</h2>
              <p className="text-muted-foreground">Please wait while we load your quiz results.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-6">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Error</h2>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => navigate("/results")}>View All Results</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Apply filtering
  const filteredResults = allResults.filter(result => {
    if (filter === "all") return true;
    const passed = result.score.percentage >= 60; // Consider 60% as passing
    return filter === "passed" ? passed : !passed;
  });

  // Apply sorting
  const sortedResults = [...filteredResults].sort((a, b) => {
    switch (sort) {
      case "score":
        return b.score.percentage - a.score.percentage;
      case "title":
        return a.quizTitle.localeCompare(b.quizTitle);
      default: // date
        return b.timestamp - a.timestamp;
    }
  });

  // If viewing a specific result
  if (resultId) {
    // Try to get result from state first
    let result = getResult(resultId);
    
    if (!result) {
      // If not in state, check localStorage directly
      try {
        const savedResults = JSON.parse(localStorage.getItem('quiz-results') || '[]');
        const savedResult = savedResults.find((r: any) => r.id === resultId);
        
        if (savedResult) {
          // Add to state and use it
          saveResult(savedResult.quizSnapshot, savedResult.state);
          result = savedResult;
        }
      } catch (err) {
        console.error('Error checking localStorage:', err);
      }
    }

    // If still no result, show error
    if (!result) {
      return (
        <div className="min-h-screen bg-background">
          <Header />
          <div className="container py-6">
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <h2 className="text-xl font-semibold mb-2">Result Not Found</h2>
                <p className="text-muted-foreground mb-4">The quiz result you're looking for could not be found.</p>
                <Button onClick={() => navigate("/results")}>View All Results</Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Show the result
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-6">
          <h1 className="text-3xl font-bold mb-6">Quiz Result</h1>
          <QuizResults
            quiz={result.quizSnapshot}
            state={result.state}
            onRetry={() => navigate(`/quiz/${result.quizId}`)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Quiz Results</h1>
          <div className="flex gap-4">
            <Select value={filter} onValueChange={(value: FilterOption) => setFilter(value)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter results" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Results</SelectItem>
                <SelectItem value="passed">Passed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={(value: SortOption) => setSort(value)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="score">Score</SelectItem>
                <SelectItem value="title">Quiz Title</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {sortedResults.length > 0 ? (
          <div className="space-y-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden md:table-cell">Quiz Title</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead className="hidden md:table-cell">Stats</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedResults.map((result) => (
                  <TableRow 
                    key={result.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/results/${result.id}`)}
                  >
                    <TableCell className="font-medium hidden md:table-cell">{result.quizTitle}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {format(result.timestamp, "MMM d, yyyy h:mm a")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className={`text-lg font-bold ${
                            result.score.percentage >= 60
                              ? "text-green-500"
                              : "text-red-500"
                          }`}
                        >
                          {result.score.percentage.toFixed(1)}%
                        </div>
                        <div className="text-sm text-muted-foreground">
                          ({result.score.total.toFixed(1)}/{result.quizSnapshot.questions.length})
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 text-green-500">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{result.score.correct}</span>
                        </div>
                        <div className="flex items-center gap-1 text-red-500">
                          <XCircle className="w-4 h-4" />
                          <span>{result.score.incorrect}</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <HelpCircle className="w-4 h-4" />
                          <span>{result.score.notAttempted}</span>
                        </div>
                        <div className="flex items-center gap-1 text-blue-500">
                          <Clock className="w-4 h-4" />
                          <span>{Math.floor(result.timeTaken / 60)}m</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/results/${result.id}`);
                          }}
                        >
                          <BarChart className="w-4 h-4 mr-1" />
                          Details
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteResult(result.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No quiz results found</p>
          </Card>
        )}

        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Result</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this quiz result? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}