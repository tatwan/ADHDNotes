import { create } from 'zustand';
import { DailyNote, ProjectNote } from '@/types';
import {
  readFile,
  writeFile,
  getDailyNoteFilePath,
  fileExists
} from '@utils/fileSystem';
import { parseMarkdownContent, generateDailyNoteTemplate } from '@utils/markdownParser';
import { formatDateForFileName } from '@utils/dateUtils';

interface NoteStoreState {
  currentNote: DailyNote | ProjectNote | null;
  dailyNotes: Map<string, DailyNote>;
  projectNotes: Map<string, ProjectNote>;
  currentDate: Date;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadDailyNote: (date: Date) => Promise<void>;
  loadProjectNote: (filePath: string) => Promise<void>;
  saveCurrentNote: () => Promise<void>;
  updateNoteContent: (content: string) => void;
  createDailyNote: (date: Date) => Promise<void>;
  createProjectNote: (title: string, filePath: string) => Promise<void>;
  deleteNote: (filePath: string) => Promise<void>;
  renameNote: (oldPath: string, newPath: string) => Promise<void>;
  setCurrentDate: (date: Date) => void;
}

export const useNoteStore = create<NoteStoreState>((set, get) => ({
  currentNote: null,
  dailyNotes: new Map(),
  projectNotes: new Map(),
  currentDate: new Date(),
  isLoading: false,
  error: null,

  setCurrentDate: (date: Date) => {
    set({ currentDate: date });
  },

  loadDailyNote: async (date: Date) => {
    set({ isLoading: true, error: null });

    try {
      const filePath = await getDailyNoteFilePath(date);
      const exists = await fileExists(filePath);

      if (!exists) {
        // Create new daily note if it doesn't exist
        await get().createDailyNote(date);
        return;
      }

      const result = await readFile(filePath);
      if (!result.success || !result.data) {
        set({ error: result.error || 'Failed to read file', isLoading: false });
        return;
      }

      const { tasks, timeBlocks } = parseMarkdownContent(result.data, date);

      const dailyNote: DailyNote = {
        id: formatDateForFileName(date),
        date,
        filePath,
        content: result.data,
        tasks,
        timeBlocks,
        lastModified: new Date()
      };

      const dailyNotes = new Map(get().dailyNotes);
      dailyNotes.set(dailyNote.id, dailyNote);

      set({
        currentNote: dailyNote,
        dailyNotes,
        currentDate: date,
        isLoading: false
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  loadProjectNote: async (filePath: string) => {
    set({ isLoading: true, error: null });

    try {
      const result = await readFile(filePath);
      if (!result.success || !result.data) {
        set({ error: result.error || 'Failed to read file', isLoading: false });
        return;
      }

      // Extract title from file path
      const fileName = filePath.split('/').pop() || 'Untitled';
      const title = fileName.replace('.md', '');

      const { tasks } = parseMarkdownContent(result.data, new Date());

      const projectNote: ProjectNote = {
        id: filePath,
        title,
        filePath,
        content: result.data,
        tasks,
        lastModified: new Date()
      };

      const projectNotes = new Map(get().projectNotes);
      projectNotes.set(filePath, projectNote);

      set({
        currentNote: projectNote,
        projectNotes,
        isLoading: false
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  saveCurrentNote: async () => {
    const { currentNote } = get();
    if (!currentNote) return;

    try {
      const result = await writeFile(currentNote.filePath, currentNote.content);
      if (!result.success) {
        set({ error: result.error || 'Failed to save file' });
        return;
      }

      // Update last modified
      const updatedNote = {
        ...currentNote,
        lastModified: new Date()
      };

      set({ currentNote: updatedNote });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  updateNoteContent: (content: string) => {
    const { currentNote } = get();
    if (!currentNote) return;

    // Parse tasks and time blocks from new content
    const date = 'date' in currentNote ? currentNote.date : new Date();
    const { tasks, timeBlocks } = parseMarkdownContent(content, date);

    const updatedNote = {
      ...currentNote,
      content,
      tasks,
      ...('timeBlocks' in currentNote ? { timeBlocks } : {})
    };

    set({ currentNote: updatedNote });
  },

  createDailyNote: async (date: Date) => {
    set({ isLoading: true, error: null });

    try {
      const filePath = await getDailyNoteFilePath(date);
      const template = generateDailyNoteTemplate(date);

      const result = await writeFile(filePath, template);
      if (!result.success) {
        set({ error: result.error || 'Failed to create file', isLoading: false });
        return;
      }

      const dailyNote: DailyNote = {
        id: formatDateForFileName(date),
        date,
        filePath,
        content: template,
        tasks: [],
        timeBlocks: [],
        lastModified: new Date()
      };

      const dailyNotes = new Map(get().dailyNotes);
      dailyNotes.set(dailyNote.id, dailyNote);

      set({
        currentNote: dailyNote,
        dailyNotes,
        currentDate: date,
        isLoading: false
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  createProjectNote: async (title: string, filePath: string) => {
    set({ isLoading: true, error: null });

    try {
      const content = `# ${title}\n\n`;

      const result = await writeFile(filePath, content);
      if (!result.success) {
        set({ error: result.error || 'Failed to create file', isLoading: false });
        return;
      }

      const projectNote: ProjectNote = {
        id: filePath,
        title,
        filePath,
        content,
        tasks: [],
        lastModified: new Date()
      };

      const projectNotes = new Map(get().projectNotes);
      projectNotes.set(filePath, projectNote);

      set({
        currentNote: projectNote,
        projectNotes,
        isLoading: false
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  deleteNote: async (filePath: string) => {
    // This will be implemented when we need file deletion
    console.log('Delete note:', filePath);
  },

  renameNote: async (oldPath: string, newPath: string) => {
    // This will be implemented when we need file renaming
    console.log('Rename note:', oldPath, newPath);
  }
}));
