// Core data types

export interface Task {
  id: string;
  content: string;
  completed: boolean;
  lineNumber: number;
  createdDate: string;
  scheduledTime?: string; // HH:MM format
  indentLevel: number; // 0 for parent tasks, >0 for subtasks
  parentId?: string; // Reference to parent task if this is a subtask
}

export interface TimeBlock {
  id: string;
  content: string;
  completed: boolean;
  startTime?: string; // HH:MM format
  duration: number; // in minutes, default 60
  lineNumber: number;
}

export interface DailyNote {
  id: string; // YYYY-MM-DD format
  date: Date;
  filePath: string;
  content: string;
  tasks: Task[];
  timeBlocks: TimeBlock[];
  lastModified: Date;
}

export interface ProjectNote {
  id: string;
  title: string;
  filePath: string;
  content: string;
  tasks: Task[];
  lastModified: Date;
  folder?: string; // Parent folder path if nested
}

export interface FileTreeItem {
  id: string;
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileTreeItem[];
  modified: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  source: 'google' | 'microsoft';
  description?: string;
  location?: string;
}

// App settings and preferences

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  editorFontSize: number;
  timelineStartHour: number; // 0-23
  timelineEndHour: number; // 0-23
  autoSaveInterval: number; // in milliseconds
  calendarSyncEnabled: boolean;
  selectedCalendars: string[];
  lastReviewedDate?: string; // YYYY-MM-DD format for migration tracking
  windowWidth?: number;
  windowHeight?: number;
  sidebarWidth?: number;
  rightPanelWidth?: number;
}

// Migration-specific types

export interface MigrationTask {
  id: string;
  content: string;
  originalDate: string;
  lineNumber: number;
  indentLevel: number;
}

export interface MigrationDecision {
  taskId: string;
  action: 'move' | 'dismiss';
  timestamp: Date;
  targetDate?: string; // Date task was moved to
}

export interface MigrationHistory {
  taskContent: string;
  originalDate: string;
  decision: 'move' | 'dismiss';
  targetDate?: string;
  timestamp: string;
}

// UI State types

export interface EditorState {
  currentNote: DailyNote | ProjectNote | null;
  isDaily: boolean;
  hasUnsavedChanges: boolean;
  cursorPosition: number;
  selectedText?: string;
}

export interface TimelineSlot {
  hour: number;
  minute: number;
  tasks: Task[];
  timeBlocks: TimeBlock[];
  events: CalendarEvent[];
}

// Store types

export interface NoteStore {
  currentNote: DailyNote | ProjectNote | null;
  dailyNotes: Map<string, DailyNote>;
  projectNotes: Map<string, ProjectNote>;
  currentDate: Date;

  // Actions
  loadDailyNote: (date: Date) => Promise<void>;
  loadProjectNote: (filePath: string) => Promise<void>;
  saveCurrentNote: () => Promise<void>;
  updateNoteContent: (content: string) => void;
  createDailyNote: (date: Date) => Promise<void>;
  createProjectNote: (title: string, folder?: string) => Promise<void>;
  deleteNote: (filePath: string) => Promise<void>;
  renameNote: (oldPath: string, newPath: string) => Promise<void>;
}

export interface TaskStore {
  tasks: Task[];
  timeBlocks: TimeBlock[];
  scheduledTasks: Map<string, Task[]>; // time -> tasks

  // Actions
  toggleTaskCompletion: (taskId: string) => void;
  scheduleTask: (taskId: string, time: string) => void;
  unscheduleTask: (taskId: string) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  getTasksForTime: (time: string) => Task[];
  parseTasksFromContent: (content: string) => { tasks: Task[]; timeBlocks: TimeBlock[] };
}

export interface AppStore {
  settings: AppSettings;
  migrationQueue: MigrationTask[];
  showMigrationModal: boolean;
  sidebarExpanded: boolean;
  rightPanelExpanded: boolean;
  notesDirectory: string;
  fileTree: FileTreeItem[];

  // Actions
  updateSettings: (updates: Partial<AppSettings>) => void;
  loadSettings: () => Promise<void>;
  saveSettings: () => Promise<void>;
  setMigrationQueue: (tasks: MigrationTask[]) => void;
  processMigrationDecision: (taskId: string, action: 'move' | 'dismiss') => void;
  checkForMigration: () => Promise<void>;
  loadFileTree: () => Promise<void>;
  toggleSidebar: () => void;
  toggleRightPanel: () => void;
}

// Utility types

export interface ParsedContent {
  tasks: Task[];
  timeBlocks: TimeBlock[];
}

export interface FileSystemResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface DragItem {
  type: 'task' | 'timeblock';
  id: string;
  content: string;
}

export interface DropResult {
  hour: number;
  minute: number;
}

// Constants

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  editorFontSize: 14,
  timelineStartHour: 8,
  timelineEndHour: 22,
  autoSaveInterval: 3000,
  calendarSyncEnabled: false,
  selectedCalendars: [],
  sidebarWidth: 250,
  rightPanelWidth: 350
};

export const TASK_REGEX = /^\s*([\*\-])\s+\[([ x])\]\s+(.+)$/;
export const TIME_BLOCK_REGEX = /^\s*\+\s+\[([ x])\]\s*(?:(\d{1,2}:\d{2}))?\s*(.+)$/;
export const TIME_PATTERN = /(\d{1,2}):(\d{2})/;

// Electron API types
declare global {
  interface Window {
    electronAPI: {
      getDailyDir: () => Promise<string>;
      getNotesDir: () => Promise<string>;
      readFile: (filePath: string) => Promise<{ success: boolean; content?: string; error?: string }>;
      writeFile: (filePath: string, content: string) => Promise<{ success: boolean; error?: string }>;
      listFiles: (dirPath: string) => Promise<{
        success: boolean;
        files?: Array<{
          name: string;
          path: string;
          isDirectory: boolean;
          modified: string;
        }>;
        error?: string
      }>;
      deleteFile: (filePath: string) => Promise<{ success: boolean; error?: string }>;
      createFolder: (dirPath: string) => Promise<{ success: boolean; error?: string }>;
      renameFile: (oldPath: string, newPath: string) => Promise<{ success: boolean; error?: string }>;
      fileExists: (filePath: string) => Promise<{ success: boolean; exists: boolean }>;
      copyFile: (sourcePath: string, destPath: string) => Promise<{ success: boolean; error?: string }>;
      readImageFile: (filePath: string) => Promise<{ success: boolean; dataUrl?: string; error?: string }>;
      openFolderDialog: () => Promise<{ success: boolean; directory?: string }>;
      path: {
        dirname: (filePath: string) => Promise<string>;
        resolve: (...paths: string[]) => Promise<string>;
      };
      storeGet: (key: string) => Promise<any>;
      storeSet: (key: string, value: any) => Promise<{ success: boolean }>;
      storeDelete: (key: string) => Promise<{ success: boolean }>;
      onFileAdded: (callback: (filePath: string) => void) => void;
      onFileChanged: (callback: (filePath: string) => void) => void;
      onFileDeleted: (callback: (filePath: string) => void) => void;
      onNotesDirChanged: (callback: (newDir: string) => void) => void;
      removeFileListeners: () => void;
      listThemes: () => Promise<{
        success: boolean;
        themes: Array<{ name: string; file: string }>;
        error?: string;
      }>;
      readThemeFile: (fileName: string) => Promise<{
        success: boolean;
        content?: string;
        error?: string;
      }>;
    };
  }
}
