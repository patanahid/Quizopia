import { useState, useEffect, useCallback } from 'react';
import { QuizState } from '@/types/quiz';
import { toast } from 'sonner';

export interface SaveSlot {
  id: string;
  state: QuizState;
  timestamp: number;
  name: string;
  isAutosave: boolean;
}

interface SaveSystemOptions {
  quizId: string;
  autoSaveInterval?: number; // in milliseconds
  maxManualSlots?: number;
}

export function useSaveSystem({ 
  quizId, 
  autoSaveInterval = 30000, // 30 seconds
  maxManualSlots = 3 
}: SaveSystemOptions) {
  const [saveSlots, setSaveSlots] = useState<SaveSlot[]>([]);

  // Load saves from localStorage
  useEffect(() => {
    const loadSaves = () => {
      const saves = localStorage.getItem(`quiz-${quizId}-saves`);
      if (saves) {
        setSaveSlots(JSON.parse(saves));
      }
    };
    loadSaves();
  }, [quizId]);

  // Save to localStorage whenever slots change
  useEffect(() => {
    localStorage.setItem(`quiz-${quizId}-saves`, JSON.stringify(saveSlots));
  }, [saveSlots, quizId]);

  // Create a new save
  const createSave = useCallback((state: QuizState, name: string, isAutosave = false) => {
    setSaveSlots(prev => {
      const newSlots = [...prev];
      
      // If it's an autosave, replace the old autosave
      if (isAutosave) {
        const autoSaveIndex = newSlots.findIndex(slot => slot.isAutosave);
        const newSave: SaveSlot = {
          id: autoSaveIndex >= 0 ? newSlots[autoSaveIndex].id : crypto.randomUUID(),
          state,
          timestamp: Date.now(),
          name: "Autosave",
          isAutosave: true
        };
        
        if (autoSaveIndex >= 0) {
          newSlots[autoSaveIndex] = newSave;
        } else {
          newSlots.push(newSave);
        }
      } else {
        // For manual saves, check if we've reached the limit
        const manualSlots = newSlots.filter(slot => !slot.isAutosave);
        if (manualSlots.length >= maxManualSlots) {
          toast.error(`Maximum number of save slots (${maxManualSlots}) reached. Please delete a save first.`);
          return prev;
        }

        newSlots.push({
          id: crypto.randomUUID(),
          state,
          timestamp: Date.now(),
          name,
          isAutosave: false
        });
      }

      return newSlots;
    });
  }, [maxManualSlots]);

  // Delete a save
  const deleteSave = useCallback((id: string) => {
    setSaveSlots(prev => prev.filter(slot => slot.id !== id));
  }, []);

  // Clear all saves
  const clearAllSaves = useCallback(() => {
    setSaveSlots([]);
    localStorage.removeItem(`quiz-${quizId}-saves`);
    // Remove notification moved to Quiz component
  }, [quizId]);

  // Load a save
  const loadSave = useCallback((id: string) => {
    const save = saveSlots.find(slot => slot.id === id);
    if (save) {
      return save.state;
    }
    return null;
  }, [saveSlots]);

  // Setup autosave - only create initial save when quiz starts
  const setupAutosave = useCallback((state: QuizState) => {
    // Create initial autosave when quiz starts
    if (!state.isPaused && !state.isComplete) {
      createSave(state, "Autosave", true);
    }

    const intervalId = setInterval(() => {
      if (!state.isPaused && !state.isComplete) {
        createSave(state, "Autosave", true);
      }
    }, autoSaveInterval);

    return () => clearInterval(intervalId);
  }, [autoSaveInterval, createSave]);

  return {
    saveSlots,
    createSave,
    deleteSave,
    loadSave,
    setupAutosave,
    clearAllSaves
  };
}
