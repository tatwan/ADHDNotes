import { app, BrowserWindow, ipcMain, Menu } from 'electron';
import { join } from 'path';
import { promises as fs } from 'fs';
import { homedir } from 'os';
import chokidar from 'chokidar';
import Store from 'electron-store';

const store = new Store();

let mainWindow: BrowserWindow | null = null;
let fileWatcher: chokidar.FSWatcher | null = null;

const NOTES_DIR = join(homedir(), 'Documents', 'ADHDNotes');
const DAILY_DIR = join(NOTES_DIR, 'daily');
const PROJECTS_DIR = join(NOTES_DIR, 'projects');

// Ensure notes directories exist
async function ensureDirectories() {
  try {
    await fs.mkdir(DAILY_DIR, { recursive: true });
    await fs.mkdir(PROJECTS_DIR, { recursive: true });
    console.log('Notes directories ensured');
  } catch (error) {
    console.error('Error creating directories:', error);
  }
}

// Create main window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    },
    titleBarStyle: 'default',
    show: false
  });

  // Load app
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    // Uncomment the line below to open dev tools by default in development
    // mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (fileWatcher) {
      fileWatcher.close();
    }
  });
}

// Setup file watcher
function setupFileWatcher() {
  fileWatcher = chokidar.watch(NOTES_DIR, {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
    ignoreInitial: true
  });

  fileWatcher
    .on('add', (path) => {
      mainWindow?.webContents.send('file-added', path);
    })
    .on('change', (path) => {
      mainWindow?.webContents.send('file-changed', path);
    })
    .on('unlink', (path) => {
      mainWindow?.webContents.send('file-deleted', path);
    });
}

// IPC Handlers
ipcMain.handle('get-notes-dir', () => {
  return NOTES_DIR;
});

ipcMain.handle('read-file', async (_, filePath: string) => {
  try {
    // Security: Ensure path is within notes directory
    if (!filePath.startsWith(NOTES_DIR)) {
      throw new Error('Access denied: Path outside notes directory');
    }
    const content = await fs.readFile(filePath, 'utf-8');
    return { success: true, content };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('write-file', async (_, filePath: string, content: string) => {
  try {
    // Security: Ensure path is within notes directory
    if (!filePath.startsWith(NOTES_DIR)) {
      throw new Error('Access denied: Path outside notes directory');
    }

    // Ensure parent directory exists
    const dir = join(filePath, '..');
    await fs.mkdir(dir, { recursive: true });

    await fs.writeFile(filePath, content, 'utf-8');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('list-files', async (_, dirPath: string) => {
  try {
    // Security: Ensure path is within notes directory
    if (!dirPath.startsWith(NOTES_DIR)) {
      throw new Error('Access denied: Path outside notes directory');
    }

    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const files = await Promise.all(
      entries.map(async (entry) => {
        const fullPath = join(dirPath, entry.name);
        const stats = await fs.stat(fullPath);
        return {
          name: entry.name,
          path: fullPath,
          isDirectory: entry.isDirectory(),
          modified: stats.mtime.toISOString()
        };
      })
    );

    return { success: true, files };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('delete-file', async (_, filePath: string) => {
  try {
    // Security: Ensure path is within notes directory
    if (!filePath.startsWith(NOTES_DIR)) {
      throw new Error('Access denied: Path outside notes directory');
    }

    await fs.unlink(filePath);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('create-folder', async (_, dirPath: string) => {
  try {
    // Security: Ensure path is within notes directory
    if (!dirPath.startsWith(NOTES_DIR)) {
      throw new Error('Access denied: Path outside notes directory');
    }

    await fs.mkdir(dirPath, { recursive: true });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('rename-file', async (_, oldPath: string, newPath: string) => {
  try {
    // Security: Ensure paths are within notes directory
    if (!oldPath.startsWith(NOTES_DIR) || !newPath.startsWith(NOTES_DIR)) {
      throw new Error('Access denied: Path outside notes directory');
    }

    await fs.rename(oldPath, newPath);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('copy-file', async (_, sourcePath: string, destPath: string) => {
  try {
    // Security: Ensure paths are within notes directory
    if (!sourcePath.startsWith(NOTES_DIR) || !destPath.startsWith(NOTES_DIR)) {
      throw new Error('Access denied: Path outside notes directory');
    }

    // Ensure destination directory exists
    const destDir = join(destPath, '..');
    await fs.mkdir(destDir, { recursive: true });

    await fs.copyFile(sourcePath, destPath);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('file-exists', async (_, filePath: string) => {
  try {
    // Security: Ensure path is within notes directory
    if (!filePath.startsWith(NOTES_DIR)) {
      throw new Error('Access denied: Path outside notes directory');
    }

    await fs.access(filePath);
    return { success: true, exists: true };
  } catch {
    return { success: true, exists: false };
  }
});

// Store handlers
ipcMain.handle('store-get', (_, key: string) => {
  return store.get(key);
});

ipcMain.handle('store-set', (_, key: string, value: any) => {
  store.set(key, value);
  return { success: true };
});

ipcMain.handle('store-delete', (_, key: string) => {
  store.delete(key);
  return { success: true };
});

// App lifecycle
app.whenReady().then(async () => {
  await ensureDirectories();
  createWindow();
  setupFileWatcher();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (fileWatcher) {
    fileWatcher.close();
  }
});
