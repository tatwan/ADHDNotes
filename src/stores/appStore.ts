import { create } from 'zustand';
import { AppSettings, MigrationTask, FileTreeItem, DEFAULT_SETTINGS } from '@/types';
import { storeGet, storeSet, buildFileTree, getProjectsDir, updateNotesDirectory } from '@utils/fileSystem';
import { checkMigrationNeeded, completeMigration, addMigrationHistory } from '@utils/migrationChecker';
import { insertMigratedTask } from '@utils/markdownParser';
import { formatDateForFileName } from '@utils/dateUtils';
import { useNoteStore } from './noteStore';

interface AppStoreState {
  settings: AppSettings;
  migrationQueue: MigrationTask[];
  showMigrationModal: boolean;
  sidebarExpanded: boolean;
  rightPanelExpanded: boolean;
  notesDirectory: string;
  fileTree: FileTreeItem[];
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  updateSettings: (updates: Partial<AppSettings>) => void;
  loadSettings: () => Promise<void>;
  saveSettings: () => Promise<void>;
  setMigrationQueue: (tasks: MigrationTask[]) => void;
  processMigrationDecision: (taskId: string, action: 'move' | 'dismiss') => Promise<void>;
  processAllMigrationDecisions: (action: 'move' | 'dismiss') => Promise<void>;
  checkForMigration: () => Promise<void>;
  loadFileTree: () => Promise<void>;
  toggleSidebar: () => void;
  toggleRightPanel: () => void;
  dismissMigrationModal: () => void;
}

export const useAppStore = create<AppStoreState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  migrationQueue: [],
  showMigrationModal: false,
  sidebarExpanded: true,
  rightPanelExpanded: true,
  notesDirectory: '',
  fileTree: [],
  isInitialized: false,

  initialize: async () => {
    await get().loadSettings();
    await get().loadFileTree();
    await get().checkForMigration();

    // Set up IPC event listeners
    window.electronAPI.onNotesDirChanged((newDir: string) => {
      updateNotesDirectory(newDir);
      get().loadFileTree();
    });

    set({ isInitialized: true });
  },

  updateSettings: (updates: Partial<AppSettings>) => {
    const currentSettings = get().settings;
    const newSettings = { ...currentSettings, ...updates };
    set({ settings: newSettings });
  },

  loadSettings: async () => {
    try {
      const savedSettings = await storeGet<AppSettings>('appSettings');

      if (savedSettings) {
        set({ settings: { ...DEFAULT_SETTINGS, ...savedSettings } });
      } else {
        // First time - save defaults
        await storeSet('appSettings', DEFAULT_SETTINGS);
        set({ settings: DEFAULT_SETTINGS });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      set({ settings: DEFAULT_SETTINGS });
    }
  },

  saveSettings: async () => {
    try {
      const { settings } = get();
      await storeSet('appSettings', settings);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  },

  setMigrationQueue: (tasks: MigrationTask[]) => {
    set({ migrationQueue: tasks, showMigrationModal: tasks.length > 0 });
  },

  processMigrationDecision: async (taskId: string, action: 'move' | 'dismiss') => {
    const { migrationQueue } = get();
    const task = migrationQueue.find(t => t.id === taskId);

    if (!task) return;

    if (action === 'move') {
      // Add task to today's note
      const noteStore = useNoteStore.getState();
      const currentNote = noteStore.currentNote;

      if (currentNote) {
        // Insert task under the Tasks section
        const updatedContent = insertMigratedTask(currentNote.content, task.content);
        noteStore.updateNoteContent(updatedContent);

        // Save the note
        await noteStore.saveCurrentNote();

        // Add to migration history
        await addMigrationHistory(
          task.content,
          task.originalDate,
          'move',
          'date' in currentNote ? formatDateForFileName(currentNote.date) : undefined
        );
      }
    } else {
      // Just mark as dismissed in history
      await addMigrationHistory(task.content, task.originalDate, 'dismiss');
    }

    // Remove from queue
    const newQueue = migrationQueue.filter(t => t.id !== taskId);
    set({ migrationQueue: newQueue });

    // If queue is empty, close modal and mark migration complete
    if (newQueue.length === 0) {
      const noteStore = useNoteStore.getState();
      await completeMigration(noteStore.currentDate);
      set({ showMigrationModal: false });
    }
  },

  processAllMigrationDecisions: async (action: 'move' | 'dismiss') => {
    const { migrationQueue } = get();

    if (migrationQueue.length === 0) return;

    if (action === 'move') {
      // Add all tasks to today's note
      const noteStore = useNoteStore.getState();
      const currentNote = noteStore.currentNote;

      if (currentNote) {
        let updatedContent = currentNote.content;

        // Add each task under the Tasks section
        for (const task of migrationQueue) {
          updatedContent = insertMigratedTask(updatedContent, task.content);

          // Add to migration history
          await addMigrationHistory(
            task.content,
            task.originalDate,
            'move',
            'date' in currentNote ? formatDateForFileName(currentNote.date) : undefined
          );
        }

        noteStore.updateNoteContent(updatedContent);
        await noteStore.saveCurrentNote();
      } else {
        // If no current note, just mark as dismissed
        for (const task of migrationQueue) {
          await addMigrationHistory(task.content, task.originalDate, 'dismiss');
        }
      }
    } else {
      // Mark all as dismissed in history
      for (const task of migrationQueue) {
        await addMigrationHistory(task.content, task.originalDate, 'dismiss');
      }
    }

    // Clear queue and close modal
    set({ migrationQueue: [] });
    const noteStore = useNoteStore.getState();
    await completeMigration(noteStore.currentDate);
    set({ showMigrationModal: false });
  },

  checkForMigration: async () => {
    try {
      const noteStore = useNoteStore.getState();
      const currentDate = noteStore.currentDate;

      const tasks = await checkMigrationNeeded(currentDate);

      if (tasks.length > 0) {
        set({ migrationQueue: tasks, showMigrationModal: true });
      }
    } catch (error) {
      console.error('Error checking migration:', error);
    }
  },

  loadFileTree: async () => {
    try {
      const projectsDir = await getProjectsDir();
      const tree = await buildFileTree(projectsDir);
      set({ fileTree: tree });
    } catch (error) {
      console.error('Error loading file tree:', error);
      set({ fileTree: [] });
    }
  },

  toggleSidebar: () => {
    set(state => ({ sidebarExpanded: !state.sidebarExpanded }));
  },

  toggleRightPanel: () => {
    set(state => ({ rightPanelExpanded: !state.rightPanelExpanded }));
  },

  dismissMigrationModal: () => {
    set({ showMigrationModal: false });
  }
}));
