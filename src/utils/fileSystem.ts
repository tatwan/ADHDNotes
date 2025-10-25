import { FileSystemResult, FileTreeItem } from '@/types';
import { join } from 'path-browserify';

/**
 * File system abstraction layer using Electron IPC
 */

let notesDir: string | null = null;

/**
 * Initialize and get notes directory
 */
export async function getNotesDirectory(): Promise<string> {
  if (!notesDir) {
    notesDir = await window.electronAPI.getNotesDir();
  }
  return notesDir;
}

/**
 * Get daily notes directory path
 */
export async function getDailyNotesDir(): Promise<string> {
  const baseDir = await getNotesDirectory();
  return join(baseDir, 'daily');
}

/**
 * Get projects directory path
 */
export async function getProjectsDir(): Promise<string> {
  const baseDir = await getNotesDirectory();
  return join(baseDir, 'projects');
}

/**
 * Read file content
 */
export async function readFile(filePath: string): Promise<FileSystemResult<string>> {
  try {
    const result = await window.electronAPI.readFile(filePath);
    if (result.success && result.content !== undefined) {
      return { success: true, data: result.content };
    }
    return { success: false, error: result.error || 'Failed to read file' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Write file content
 */
export async function writeFile(filePath: string, content: string): Promise<FileSystemResult> {
  try {
    const result = await window.electronAPI.writeFile(filePath, content);
    if (result.success) {
      return { success: true };
    }
    return { success: false, error: result.error || 'Failed to write file' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * List files in directory
 */
export async function listFiles(dirPath: string): Promise<FileSystemResult<FileTreeItem[]>> {
  try {
    const result = await window.electronAPI.listFiles(dirPath);
    if (result.success && result.files) {
      const items: FileTreeItem[] = result.files.map(file => ({
        id: file.path,
        name: file.name,
        path: file.path,
        isDirectory: file.isDirectory,
        modified: file.modified
      }));
      return { success: true, data: items };
    }
    return { success: false, error: result.error || 'Failed to list files' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Delete file
 */
export async function deleteFile(filePath: string): Promise<FileSystemResult> {
  try {
    const result = await window.electronAPI.deleteFile(filePath);
    if (result.success) {
      return { success: true };
    }
    return { success: false, error: result.error || 'Failed to delete file' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Create folder
 */
export async function createFolder(dirPath: string): Promise<FileSystemResult> {
  try {
    const result = await window.electronAPI.createFolder(dirPath);
    if (result.success) {
      return { success: true };
    }
    return { success: false, error: result.error || 'Failed to create folder' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Rename file or folder
 */
export async function renameFile(oldPath: string, newPath: string): Promise<FileSystemResult> {
  try {
    const result = await window.electronAPI.renameFile(oldPath, newPath);
    if (result.success) {
      return { success: true };
    }
    return { success: false, error: result.error || 'Failed to rename' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Copy file
 */
export async function copyFile(sourcePath: string, destPath: string): Promise<FileSystemResult> {
  try {
    const result = await window.electronAPI.copyFile(sourcePath, destPath);
    if (result.success) {
      return { success: true };
    }
    return { success: false, error: result.error || 'Failed to copy file' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Check if file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    const result = await window.electronAPI.fileExists(filePath);
    return result.exists;
  } catch (error) {
    return false;
  }
}

/**
 * Get file path for daily note
 */
export async function getDailyNoteFilePath(date: Date): Promise<string> {
  const dailyDir = await getDailyNotesDir();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const fileName = `${year}-${month}-${day}.md`;
  return join(dailyDir, fileName);
}

/**
 * Build file tree recursively
 */
export async function buildFileTree(dirPath: string): Promise<FileTreeItem[]> {
  const result = await listFiles(dirPath);
  if (!result.success || !result.data) {
    return [];
  }

  const items = result.data;
  const tree: FileTreeItem[] = [];

  for (const item of items) {
    if (item.isDirectory) {
      const children = await buildFileTree(item.path);
      tree.push({ ...item, children });
    } else if (item.name.endsWith('.md')) {
      tree.push(item);
    }
  }

  return tree.sort((a, b) => {
    // Directories first, then files
    if (a.isDirectory && !b.isDirectory) return -1;
    if (!a.isDirectory && b.isDirectory) return 1;
    return a.name.localeCompare(b.name);
  });
}

/**
 * Store operations
 */
export async function storeGet<T>(key: string): Promise<T | undefined> {
  try {
    return await window.electronAPI.storeGet(key);
  } catch (error) {
    console.error('Store get error:', error);
    return undefined;
  }
}

export async function storeSet(key: string, value: any): Promise<void> {
  try {
    await window.electronAPI.storeSet(key, value);
  } catch (error) {
    console.error('Store set error:', error);
  }
}

export async function storeDelete(key: string): Promise<void> {
  try {
    await window.electronAPI.storeDelete(key);
  } catch (error) {
    console.error('Store delete error:', error);
  }
}
