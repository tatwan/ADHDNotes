import { app, BrowserWindow, ipcMain, Menu, dialog } from 'electron';
import { join, dirname, resolve } from 'path';
import { promises as fs } from 'fs';
import chokidar from 'chokidar';
import Store from 'electron-store';

const store = new Store();

let mainWindow: BrowserWindow | null = null;
let fileWatcher: chokidar.FSWatcher | null = null;

// Get default notes directory (for daily notes)
function getDefaultNotesDir(): string {
  return join(app.getPath('documents'), 'ADHDNotes');
}

// Get custom notes directory from store (for project notes)
function getCustomNotesDir(): string {
  const stored = store.get('customNotesDir') as string;
  const baseDir = stored || getDefaultNotesDir();

  // Check if the directory itself is named "Notes"
  const dirName = baseDir.split('/').pop() || '';
  if (dirName === 'Notes') {
    // The selected directory is already the Notes folder
    return baseDir;
  } else {
    // Use Notes subfolder within the selected directory
    return join(baseDir, 'Notes');
  }
}

let DEFAULT_DAILY_DIR = join(getDefaultNotesDir(), 'daily');
let CUSTOM_NOTES_DIR = getCustomNotesDir();

// Check if path is within allowed directories
function isPathAllowed(filePath: string): boolean {
  const themesPath = join(getDefaultNotesDir(), 'themes');
  return filePath.startsWith(DEFAULT_DAILY_DIR) || filePath.startsWith(CUSTOM_NOTES_DIR) || filePath.startsWith(themesPath);
}

// Copy default themes to user themes directory on first run
async function copyDefaultThemes() {
  const userThemesDir = join(getDefaultNotesDir(), 'themes');
  let bundledThemesDir: string;

  if (process.env.NODE_ENV === 'development') {
    bundledThemesDir = join(process.cwd(), 'public', 'themes');
  } else {
    bundledThemesDir = join(__dirname, '../themes');
  }

  try {
    await fs.mkdir(userThemesDir, { recursive: true });

    const files = await fs.readdir(bundledThemesDir);
    for (const file of files) {
      if (file.endsWith('.css') && file !== 'theme-bridge.css' && !file.startsWith('.')) {
        const source = join(bundledThemesDir, file);
        const dest = join(userThemesDir, file);
        try {
          await fs.access(dest);
          // File exists, skip
        } catch {
          // File doesn't exist, copy it
          await fs.copyFile(source, dest);
        }
      }
    }
  } catch (error) {
    console.error('Error copying default themes:', error);
  }
}

// Ensure notes directories exist
async function ensureDirectories() {
  try {
    await fs.mkdir(DEFAULT_DAILY_DIR, { recursive: true });
    await fs.mkdir(CUSTOM_NOTES_DIR, { recursive: true });
    await copyDefaultThemes();
    console.log('Notes directories ensured');
  } catch (error) {
    console.error('Error creating directories:', error);
  }
}

// Update custom notes directory and restart file watcher
async function updateCustomNotesDir(newDir: string) {
  // Check if the directory itself is named "Notes"
  const dirName = newDir.split('/').pop() || '';
  if (dirName === 'Notes') {
    // The selected directory is already the Notes folder
    CUSTOM_NOTES_DIR = newDir;
  } else {
    // Use Notes subfolder within the selected directory
    CUSTOM_NOTES_DIR = join(newDir, 'Notes');
  }

  // Store the selected directory
  store.set('customNotesDir', newDir);

  // Recreate directories if needed (will create Notes subfolder if it doesn't exist)
  await ensureDirectories();

  // Restart file watcher
  if (fileWatcher) {
    fileWatcher.close();
  }
  setupFileWatcher();

  // Notify renderer of directory change
  mainWindow?.webContents.send('custom-notes-dir-changed', newDir);
}

// Create application menu
function createMenu() {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open Folder...',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow!, {
              properties: ['openDirectory', 'createDirectory'],
              title: 'Select Notes Directory',
              buttonLabel: 'Select Folder'
            });

            if (!result.canceled && result.filePaths.length > 0) {
              await updateCustomNotesDir(result.filePaths[0]);
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    }
  ];

  // macOS specific menu adjustments
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services', submenu: [] },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    });

    // Window menu
    template[4].submenu = [
      { role: 'close' },
      { role: 'minimize' },
      { role: 'zoom' },
      { type: 'separator' },
      { role: 'front' }
    ];
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
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
    // Set titlebar and icon. For macOS the icon is handled via app bundle, but adding
    // the icon helps for Windows/Linux and in dev builds.
    titleBarStyle: 'default',
    icon: (process.env.VITE_DEV_SERVER_URL)
      ? join(process.cwd(), 'img', 'icon_latest_version.png')
      : join(__dirname, '..', 'img', 'icon_latest_version.png'),
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
  // Watch both daily and custom notes directories, and themes directory
  const themesPath = join(getDefaultNotesDir(), 'themes');
  const watchPaths = [DEFAULT_DAILY_DIR, CUSTOM_NOTES_DIR, themesPath];
  fileWatcher = chokidar.watch(watchPaths, {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
    ignoreInitial: true
  });

  fileWatcher
    .on('add', (path) => {
      if (path.startsWith(themesPath)) {
        mainWindow?.webContents.send('theme-file-added', path);
      } else {
        mainWindow?.webContents.send('file-added', path);
      }
    })
    .on('change', (path) => {
      if (path.startsWith(themesPath)) {
        mainWindow?.webContents.send('theme-file-changed', path);
      } else {
        mainWindow?.webContents.send('file-changed', path);
      }
    })
    .on('unlink', (path) => {
      if (path.startsWith(themesPath)) {
        mainWindow?.webContents.send('theme-file-deleted', path);
      } else {
        mainWindow?.webContents.send('file-deleted', path);
      }
    });
}

// IPC Handlers
ipcMain.handle('get-daily-dir', () => {
  return DEFAULT_DAILY_DIR;
});

ipcMain.handle('get-notes-dir', () => {
  return CUSTOM_NOTES_DIR;
});

ipcMain.handle('read-file', async (_, filePath: string) => {
  try {
    // Security: Ensure path is within allowed directories
    if (!isPathAllowed(filePath)) {
      throw new Error('Access denied: Path outside allowed directories');
    }
    const content = await fs.readFile(filePath, 'utf-8');
    return { success: true, content };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('write-file', async (_, filePath: string, content: string) => {
  try {
    // Security: Ensure path is within allowed directories
    if (!isPathAllowed(filePath)) {
      throw new Error('Access denied: Path outside allowed directories');
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
    // Security: Ensure path is within allowed directories
    if (!isPathAllowed(dirPath)) {
      throw new Error('Access denied: Path outside allowed directories');
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
    // Security: Ensure path is within allowed directories
    if (!isPathAllowed(filePath)) {
      throw new Error('Access denied: Path outside allowed directories');
    }

    // Use fs.rm for both files and directories (recursive for directories)
    await fs.rm(filePath, { recursive: true, force: true });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('create-folder', async (_, dirPath: string) => {
  try {
    // Security: Ensure path is within allowed directories
    if (!isPathAllowed(dirPath)) {
      throw new Error('Access denied: Path outside allowed directories');
    }

    await fs.mkdir(dirPath, { recursive: true });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('rename-file', async (_, oldPath: string, newPath: string) => {
  try {
    // Security: Ensure paths are within allowed directories
    if (!isPathAllowed(oldPath) || !isPathAllowed(newPath)) {
      throw new Error('Access denied: Path outside allowed directories');
    }

    await fs.rename(oldPath, newPath);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('copy-file', async (_, sourcePath: string, destPath: string) => {
  try {
    // Security: Ensure paths are within allowed directories
    if (!isPathAllowed(sourcePath) || !isPathAllowed(destPath)) {
      throw new Error('Access denied: Path outside allowed directories');
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
    // Security: Ensure path is within allowed directories
    if (!isPathAllowed(filePath)) {
      throw new Error('Access denied: Path outside allowed directories');
    }

    await fs.access(filePath);
    return { success: true, exists: true };
  } catch {
    return { success: true, exists: false };
  }
});

ipcMain.handle('read-image-file', async (_, filePath: string) => {
  try {
    // Security: Ensure path is within allowed directories
    if (!isPathAllowed(filePath)) {
      throw new Error('Access denied: Path outside allowed directories');
    }

    const buffer = await fs.readFile(filePath);
    const ext = filePath.split('.').pop()?.toLowerCase() || 'png';
    const mimeType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;
    const dataUrl = `data:${mimeType};base64,${buffer.toString('base64')}`;
    return { success: true, dataUrl };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// Path utility handlers
ipcMain.handle('path-dirname', (_, filePath: string) => {
  return dirname(filePath);
});

ipcMain.handle('path-resolve', (_, ...paths: string[]) => {
  return resolve(...paths);
});

// Store handlers
ipcMain.handle('store-get', (_, key: string) => {
  return store.get(key);
});

ipcMain.handle('store-set', (_, key: string, value: any) => {
  store.set(key, value);
  return { success: true };
});

// Theme handlers
ipcMain.handle('list-themes', async () => {
  try {
    const themesPath = join(getDefaultNotesDir(), 'themes');

    // Ensure themes directory exists
    await fs.mkdir(themesPath, { recursive: true });

    // List all .css files in themes directory (excluding theme-bridge.css)
    const files = await fs.readdir(themesPath);
    const cssFiles = files.filter(file =>
      file.endsWith('.css') &&
      file !== 'theme-bridge.css' &&
      !file.startsWith('.')
    );

    // Return theme objects
    const themes = cssFiles.map(file => ({
      name: file.replace('.css', '').split('-').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' '),
      file: file
    }));

    return { success: true, themes };
  } catch (error) {
    console.error('Error listing themes:', error);
    return { success: false, error: 'Failed to list themes', themes: [] };
  }
});

ipcMain.handle('read-theme-file', async (_, fileName: string) => {
  try {
    const themesPath = join(getDefaultNotesDir(), 'themes');
    const filePath = join(themesPath, fileName);

    // Security: Ensure path is within themes directory
    if (!filePath.startsWith(themesPath)) {
      throw new Error('Access denied: Path outside themes directory');
    }

    const content = await fs.readFile(filePath, 'utf-8');
    return { success: true, content };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('open-folder-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory', 'createDirectory'],
    title: 'Select Notes Directory',
    buttonLabel: 'Select Folder'
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const newDir = result.filePaths[0];
    await updateCustomNotesDir(newDir);
    return { success: true, directory: newDir };
  }

  return { success: false };
});

// App lifecycle
app.whenReady().then(async () => {
  await ensureDirectories();
  createWindow();
  createMenu();
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
