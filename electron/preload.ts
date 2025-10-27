import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // File system operations
  getDailyDir: () => ipcRenderer.invoke('get-daily-dir'),
  getNotesDir: () => ipcRenderer.invoke('get-notes-dir'),
  readFile: (filePath: string) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath: string, content: string) =>
    ipcRenderer.invoke('write-file', filePath, content),
  listFiles: (dirPath: string) => ipcRenderer.invoke('list-files', dirPath),
  deleteFile: (filePath: string) => ipcRenderer.invoke('delete-file', filePath),
  createFolder: (dirPath: string) => ipcRenderer.invoke('create-folder', dirPath),
  renameFile: (oldPath: string, newPath: string) =>
    ipcRenderer.invoke('rename-file', oldPath, newPath),
  fileExists: (filePath: string) => ipcRenderer.invoke('file-exists', filePath),
  copyFile: (sourcePath: string, destPath: string) =>
    ipcRenderer.invoke('copy-file', sourcePath, destPath),
  readImageFile: (filePath: string) => ipcRenderer.invoke('read-image-file', filePath),

  // Folder dialog
  openFolderDialog: () => ipcRenderer.invoke('open-folder-dialog'),

  // Path utilities
  path: {
    dirname: (filePath: string) => ipcRenderer.invoke('path-dirname', filePath),
    resolve: (...paths: string[]) => ipcRenderer.invoke('path-resolve', ...paths)
  },

  // Store operations
  storeGet: (key: string) => ipcRenderer.invoke('store-get', key),
  storeSet: (key: string, value: any) => ipcRenderer.invoke('store-set', key, value),
  storeDelete: (key: string) => ipcRenderer.invoke('store-delete', key),

  // File watcher events
  onFileAdded: (callback: (filePath: string) => void) => {
    ipcRenderer.on('file-added', (_, filePath) => callback(filePath));
  },
  onFileChanged: (callback: (filePath: string) => void) => {
    ipcRenderer.on('file-changed', (_, filePath) => callback(filePath));
  },
  onFileDeleted: (callback: (filePath: string) => void) => {
    ipcRenderer.on('file-deleted', (_, filePath) => callback(filePath));
  },
  onNotesDirChanged: (callback: (newDir: string) => void) => {
    ipcRenderer.on('custom-notes-dir-changed', (_, newDir) => callback(newDir));
  },

  // Remove listeners
  removeFileListeners: () => {
    ipcRenderer.removeAllListeners('file-added');
    ipcRenderer.removeAllListeners('file-changed');
    ipcRenderer.removeAllListeners('file-deleted');
  },

  // Theme operations
  listThemes: () => ipcRenderer.invoke('list-themes'),
  readThemeFile: (fileName: string) => ipcRenderer.invoke('read-theme-file', fileName)
});

// Type definition for window.electronAPI
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
