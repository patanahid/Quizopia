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

  // Check for existing saves
  const checkForSaves = useCallback(() => {
    console.log('Checking saves for quiz:', quizId);
    const saves = localStorage.getItem(`quiz-${quizId}-saves`);
    console.log('Raw saves from localStorage:', saves);
    
    if (saves) {
      try {
        const parsedSaves = JSON.parse(saves);
        console.log('Parsed saves:', parsedSaves);
        if (Array.isArray(parsedSaves) && parsedSaves.length > 0) {
          setSaveSlots(parsedSaves);
          return true;
        } else {
          console.log('No valid saves found, clearing localStorage');
          localStorage.removeItem(`quiz-${quizId}-saves`);
          setSaveSlots([]);
        }
      } catch (error) {
        console.error('Error parsing saves:', error);
        localStorage.removeItem(`quiz-${quizId}-saves`);
        setSaveSlots([]);
      }
    } else {
      console.log('No saves found in localStorage');
      setSaveSlots([]);
    }
    return false;
  }, [quizId]);

  // Load saves from localStorage
  useEffect(() => {
    console.log('Initial load of saves for quiz:', quizId);
    const hasSaves = checkForSaves();
    console.log('Initial load found saves:', hasSaves);
  }, [checkForSaves, quizId]);

  // Debug whenever saveSlots change
  useEffect(() => {
    console.log('Save slots updated:', saveSlots);
  }, [saveSlots]);

  // Save to localStorage whenever slots change
  useEffect(() => {
    localStorage.setItem(`quiz-${quizId}-saves`, JSON.stringify(saveSlots));
  }, [saveSlots, quizId]);

  // Create a new save
  const createSave = useCallback((state: QuizState, name: string, isAutosave = false) => {
    console.log('Creating save:', { name, isAutosave, state });
    
    setSaveSlots(prev => {
      console.log('Previous slots:', prev);
      const newSlots = [...prev];
      
      // If it's an autosave, replace the old autosave
      if (isAutosave) {
        const autoSaveIndex = newSlots.findIndex(slot => slot.isAutosave);
        console.log('Found existing autosave at index:', autoSaveIndex);
        
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
        console.log('Updated autosave:', newSave);
      } else {
        // For manual saves, check if we've reached the limit
        const manualSlots = newSlots.filter(slot => !slot.isAutosave);
        if (manualSlots.length >= maxManualSlots) {
          toast.error(`Maximum number of save slots (${maxManualSlots}) reached. Please delete a save first.`);
          return prev;
        }

        const newSave = {
          id: crypto.randomUUID(),
          state,
          timestamp: Date.now(),
          name,
          isAutosave: false
        };
        newSlots.push(newSave);
        console.log('Created manual save:', newSave);
      }

      console.log('New slots after save:', newSlots);
      // Force localStorage update
      localStorage.setItem(`quiz-${quizId}-saves`, JSON.stringify(newSlots));
      return newSlots;
    });
  }, [maxManualSlots, quizId]);

  // Delete a save
  const deleteSave = useCallback((id: string) => {
    console.log('Deleting save:', id);
    
    setSaveSlots(prev => {
      const slot = prev.find(s => s.id === id);
      console.log('Found slot to delete:', slot);
      
      let newSlots;
      if (slot?.isAutosave) {
        console.log('Deleting autosave - clearing all saves');
        localStorage.removeItem(`quiz-${quizId}-saves`);
        newSlots = [];
      } else {
        newSlots = prev.filter(slot => slot.id !== id);
        console.log('Filtered slots after delete:', newSlots);
        // Update localStorage immediately
        localStorage.setItem(`quiz-${quizId}-saves`, JSON.stringify(newSlots));
      }

      // Force a check for saves after a short delay
      setTimeout(() => {
        checkForSaves();
      }, 100);

      return newSlots;
    });
  }, [quizId, checkForSaves]);

  // Clear all saves
  const clearAllSaves = useCallback(() => {
    console.log('Clearing all saves for quiz:', quizId);
    localStorage.removeItem(`quiz-${quizId}-saves`);
    setSaveSlots([]);
    
    // Force a check for saves after clearing
    setTimeout(() => {
      checkForSaves();
    }, 100);
  }, [quizId, checkForSaves]);

  // Load a save
  const loadSave = useCallback((id: string) => {
    const save = saveSlots.find(slot => slot.id === id);
    if (save) {
      return save.state;
    }
    return null;
  }, [saveSlots]);

  // Setup autosave - only create initial save when quiz starts
  const setupAutosave = useCallback((initialState: QuizState) => {
    // Only setup autosave if quiz is active
    if (initialState.isPaused || initialState.isComplete) {
      return () => {}; // Return empty cleanup if quiz isn't active
    }

    // Create initial autosave immediately when quiz starts
    createSave(initialState, "Autosave", true);

    // Setup interval for subsequent autosaves
    const intervalId = setInterval(() => {
      // Get latest state from localStorage to ensure we're saving current progress
      const currentSaves = localStorage.getItem(`quiz-${quizId}-saves`);
      if (currentSaves) {
        try {
          const parsedSaves = JSON.parse(currentSaves);
          const currentAutosave = parsedSaves.find((s: SaveSlot) => s.isAutosave);
          if (currentAutosave) {
            createSave(currentAutosave.state, "Autosave", true);
          }
        } catch (error) {
          console.error('Error reading current state for autosave:', error);
          // Fallback to initial state if we can't get current state
          createSave(initialState, "Autosave", true);
        }
      }
    }, autoSaveInterval);

    return () => clearInterval(intervalId);
  }, [autoSaveInterval, createSave, quizId]);
return {
  saveSlots,
  createSave,
  deleteSave,
  loadSave,
  setupAutosave,
  clearAllSaves,
  checkForSaves
};
}
