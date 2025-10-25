import { useEffect, useRef } from 'react';
import { useNoteStore } from '@stores/noteStore';
import { useAppStore } from '@stores/appStore';

/**
 * Hook to handle auto-saving of notes with debouncing
 */
export const useAutoSave = () => {
  const { currentNote, saveCurrentNote } = useNoteStore();
  const { settings } = useAppStore();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousContentRef = useRef<string>('');

  useEffect(() => {
    if (!currentNote) return;

    // Check if content has changed
    if (currentNote.content !== previousContentRef.current) {
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout
      timeoutRef.current = setTimeout(() => {
        saveCurrentNote();
        previousContentRef.current = currentNote.content;
      }, settings.autoSaveInterval || 3000);
    }

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [currentNote?.content, settings.autoSaveInterval]);

  // Save on unmount
  useEffect(() => {
    return () => {
      if (currentNote && currentNote.content !== previousContentRef.current) {
        saveCurrentNote();
      }
    };
  }, []);
};
