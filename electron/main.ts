import { app, BrowserWindow, ipcMain, shell, dialog } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ディレクトリ構造の解決
const distPath = path.join(__dirname, '../dist');
const publicPath = app.isPackaged
  ? distPath
  : path.join(distPath, '../public');

process.env.DIST = distPath;
process.env.VITE_PUBLIC = publicPath;

let win: BrowserWindow | null = null;
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];

function getPreloadPath(): string {
  const mjsPath = path.join(__dirname, 'preload.mjs');
  if (fs.existsSync(mjsPath)) return mjsPath;
  const jsPath = path.join(__dirname, 'preload.js');
  if (fs.existsSync(jsPath)) return jsPath;
  return mjsPath;
}

function createWindow() {
  const iconPath = app.isPackaged
    ? path.join(distPath, 'icon.ico')
    : path.join(__dirname, '../build/icon.ico');

  win = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1024,
    minHeight: 680,
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    backgroundColor: '#0B0F19',
    title: 'CodeDictionary Studio',
    webPreferences: {
      preload: getPreloadPath(),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      webSecurity: true,
    },
  });

  // メニューバーを非表示（プロフェッショナルUI）
  win.setMenuBarVisibility(false);

  // ページの読み込み
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL).catch(() => {
      // 開発サーバーへの接続に失敗した場合はローカルHTMLにフォールバック
      if (fs.existsSync(path.join(distPath, 'index.html'))) {
        win?.loadFile(path.join(distPath, 'index.html'));
      }
    });
  } else {
    const indexPath = path.join(distPath, 'index.html');
    win.loadFile(indexPath).catch((err) => {
      console.error('[Electron] Failed to load index.html:', err);
    });
  }

  // 読み込みエラー時のフォールバック
  win.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    console.error(`[Electron] Page failed to load (${errorCode}): ${errorDescription}`);
    const fallbackPath = path.join(distPath, 'index.html');
    if (fs.existsSync(fallbackPath) && win) {
      win.loadFile(fallbackPath);
    }
  });

  // リンクを既定のブラウザで開く
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:') || url.startsWith('http:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  win.on('closed', () => {
    win = null;
  });
}

// アプリライフサイクル
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(() => {
  // IPCハンドラー
  ipcMain.handle('app:get-version', () => app.getVersion());

  ipcMain.handle('dialog:open-file', async (_event, options) => {
    if (!win) return null;
    return await dialog.showOpenDialog(win, options || {
      properties: ['openFile'],
      filters: [
        { name: 'Supported Code Files', extensions: ['py', 'ts', 'tsx', 'js', 'jsx', 'rs', 'go', 'cpp', 'c', 'h', 'hpp', 'sql', 'html', 'css', 'json'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });
  });

  ipcMain.handle('dialog:open-folder', async () => {
    if (!win) return null;
    return await dialog.showOpenDialog(win, {
      properties: ['openDirectory']
    });
  });

  ipcMain.handle('shell:open-external', async (_event, url: string) => {
    if (typeof url === 'string' && (url.startsWith('https://') || url.startsWith('http://'))) {
      await shell.openExternal(url);
      return true;
    }
    return false;
  });

  createWindow();
});
