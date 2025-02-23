import { useState, useEffect, useCallback } from 'react';
import type { QuizResult } from '@/types/results';
import type { Quiz, QuizState } from '@/types/quiz';

const STORAGE_KEY = 'quiz-results';

export function useQuizResults() {
  const [results, setResults] = useState<QuizResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load results from localStorage
  const loadFromStorage = useCallback(async () => {
    try {
      console.log('Loading results from localStorage');
      setIsLoading(true);
      
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        console.log('Parsed results:', parsed);
        
        // Validate results
        const validResults = parsed.filter((result: any) => {
          const isValid = result?.id &&
                         result?.quizSnapshot?.questions?.length > 0 &&
                         result?.state?.answers;
          if (!isValid) {
            console.warn('Invalid result found:', result);
          }
          return isValid;
        });
        
        console.log('Valid results:', validResults);
        setResults(validResults);
      } else {
        console.log('No results in localStorage');
        setResults([]);
      }
    } catch (error) {
      console.error('Failed to load results:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  // Save to localStorage whenever results change
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
        console.log('Saved results to localStorage:', results);
      } catch (error) {
        console.error('Failed to save to localStorage:', error);
      }
    }
  }, [results, isLoading]);

  // Save results to localStorage
  const persistResults = useCallback((newResults: QuizResult[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newResults));
    } catch (error) {
      console.error('Failed to save results:', error);
    }
  }, []);

  const saveResult = useCallback(async (quiz: Quiz, state: QuizState): Promise<QuizResult> => {
    console.log('Saving result - Quiz:', quiz);
    console.log('Saving result - State:', state);

    try {
      // Validate inputs
      if (!quiz?.questions?.length) {
        throw new Error('Invalid quiz data - missing questions');
      }
      if (!state?.answers) {
        throw new Error('Invalid state data - missing answers');
      }

      // Ensure we have all required quiz data
      if (!quiz.id || !quiz.title || !quiz.settings) {
        throw new Error('Invalid quiz data - missing required fields');
      }

      // Calculate stats
      const timeTaken = quiz.settings.timeLimit - state.timeRemaining;
      const answers = state.answers || {};
      
      let correctAnswers = 0;
      let wrongAnswers = 0;
      let notAttempted = 0;

      // Count answers and validate
      quiz.questions.forEach((q, index) => {
        const answer = answers[q.id];
        const isValidAnswer = answer && q.choices?.some(c => c.id === answer);
        
        console.log(`Question ${index + 1}:`, {
          id: q.id,
          answer: answer || 'not answered',
          correctAnswer: q.correctAnswer,
          isValid: isValidAnswer,
          isCorrect: answer === q.correctAnswer
        });

        if (!answer || !isValidAnswer) {
          notAttempted++;
        } else if (answer === q.correctAnswer) {
          correctAnswers++;
        } else {
          wrongAnswers++;
        }
      });

      console.log('Score calculation:', {
        correctAnswers,
        wrongAnswers,
        notAttempted,
        totalQuestions: quiz.questions.length
      });

      // Calculate score
      const totalScore = Math.max(0, correctAnswers - (wrongAnswers * 0.25));
      const percentage = (totalScore / quiz.questions.length) * 100;

      // Create result object
      const result: QuizResult = {
        id: crypto.randomUUID(),
        quizId: quiz.id,
        quizTitle: quiz.title,
        quizSnapshot: quiz,
        state: {
          ...state,
          answers: { ...answers }
        },
        timestamp: Date.now(),
        score: {
          total: totalScore,
          percentage,
          correct: correctAnswers,
          incorrect: wrongAnswers,
          notAttempted,
          marksGained: correctAnswers,
          marksDeducted: wrongAnswers * 0.25
        },
        timeTaken
      };

      console.log('Created result:', result);

      // Update state and localStorage atomically
      setResults(prev => {
        const newResults = [result, ...prev];
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(newResults));
          console.log('Saved to localStorage successfully');
        } catch (error) {
          console.error('Failed to save to localStorage:', error);
        }
        return newResults;
      });

      // Wait for state update and verify
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verify the result was saved
      const savedResults = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      const savedResult = savedResults.find((r: any) => r.id === result.id);
      
      if (!savedResult) {
        throw new Error('Failed to save result - not found in localStorage');
      }

      console.log('Saved and verified result successfully');
      return result;
    } catch (error) {
      console.error('Error in saveResult:', error);
      throw error;
    }
  }, []);

  const getResult = useCallback((resultId: string) => {
    console.log('Getting result:', resultId);
    console.log('Current results:', results);
    
    // Try to find in current state
    let result = results.find(result => result.id === resultId);
    
    if (result) {
      console.log('Found result in state:', result);
      return result;
    }
    
    // Try to find in localStorage
    try {
      console.log('Checking localStorage for result');
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const allResults = JSON.parse(stored);
        result = allResults.find((r: any) => r.id === resultId);
        if (result) {
          console.log('Found result in localStorage:', result);
          // Add to state
          setResults(prev => [result, ...prev.filter(r => r.id !== resultId)]);
          return result;
        }
      }
    } catch (error) {
      console.error('Error checking localStorage:', error);
    }
    
    console.log('Result not found anywhere');
    return null;
  }, [results]);

  const getResultsByQuiz = useCallback((quizId: string) => {
    return results.filter(result => result.quizId === quizId);
  }, [results]);

  const getAllResults = useCallback(() => {
    return [...results].sort((a, b) => b.timestamp - a.timestamp); // Most recent first
  }, [results]);

  const deleteResult = useCallback((resultId: string) => {
    setResults(prev => {
      const newResults = prev.filter(result => result.id !== resultId);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newResults));
      } catch (error) {
        console.error('Failed to save to localStorage:', error);
      }
      return newResults;
    });
  }, []);

  const clearAllResults = useCallback(() => {
    setResults([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    saveResult,
    getResult,
    getResultsByQuiz,
    getAllResults,
    deleteResult,
    clearAllResults,
    loadFromStorage,
    isLoading
  };
}