import { app, BrowserWindow, ipcMain, shell, dialog, protocol, net } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';

// キャッシュロック・GPUキャッシュ競合エラーの回避
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');
app.commandLine.appendSwitch('no-sandbox');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ディレクトリ構造の解決（app.getAppPath() を基点にするのが一番確実）
const distPath = path.join(app.getAppPath(), 'dist');
const publicPath = app.isPackaged
  ? distPath
  : path.join(app.getAppPath(), 'public');

process.env.DIST = distPath;
process.env.VITE_PUBLIC = publicPath;

let win: BrowserWindow | null = null;
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];

// シングルインスタンスロック（多重起動によるキャッシュロック防止）
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });
}

function getPreloadPath(): string {
  const mjsPath = path.join(app.getAppPath(), 'dist-electron', 'preload.mjs');
  if (fs.existsSync(mjsPath)) return mjsPath;
  const jsPath = path.join(app.getAppPath(), 'dist-electron', 'preload.js');
  if (fs.existsSync(jsPath)) return jsPath;
  return path.join(__dirname, 'preload.mjs');
}

// セキュリティ無効化とカスタムプロトコルを許可するためのスキーム登録
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true, supportFetchAPI: true, bypassCSP: true } }
]);

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
      webSecurity: false, // ローカルWASMファイルのクロスオリジン制限解除
    },
  });

  win.setMenuBarVisibility(false);
  
  // デバッグ用: DEVTOOLS を開く
  win.webContents.openDevTools();

  // 画面のエラーをNode.jsコンソールへ転送
  win.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[Browser Console] ${message} (line: ${line})`);
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL).catch(() => {
      if (fs.existsSync(path.join(distPath, 'index.html'))) {
        win?.loadURL('app://-/index.html');
      }
    });
  } else {
    win.loadURL('app://-/index.html').catch((err) => {
      console.error('[Electron] Failed to load index.html via app:// protocol:', err);
    });
  }

  win.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    console.error(`[Electron] Page failed to load (${errorCode}): ${errorDescription}`);
    if (win) win.loadURL('app://-/index.html');
  });

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
  // カスタムプロトコル app:// を登録（Chromium のマルチバイト文字パスバグを回避）
  protocol.handle('app', async (request) => {
    let url = request.url.replace(/^app:\/\/-/, '');
    // URLデコードしてクエリパラメータを削除
    try { url = decodeURI(url); } catch (e) {}
    if (url.includes('?')) url = url.split('?')[0];
    if (url.includes('#')) url = url.split('#')[0];
    
    // dist パスから絶対パスを生成
    let absolutePath = path.join(distPath, url);
    // パスが '/' の場合は index.html を返す
    if (url === '/' || url === '' || url === '\\') {
      absolutePath = path.join(distPath, 'index.html');
    }

    try {
      // net.fetch の代わりに Node.js の fs で直接読み込むことで
      // マルチバイト文字パス(★など)による Chromium の ERR_FAILED バグを回避
      const data = await fs.promises.readFile(absolutePath);
      
      // 拡張子から簡易的な MIME タイプを判定
      const ext = path.extname(absolutePath).toLowerCase();
      let mimeType = 'text/plain';
      if (ext === '.html') mimeType = 'text/html; charset=utf-8';
      else if (ext === '.js' || ext === '.mjs') mimeType = 'text/javascript';
      else if (ext === '.css') mimeType = 'text/css';
      else if (ext === '.json') mimeType = 'application/json';
      else if (ext === '.wasm') mimeType = 'application/wasm';
      else if (ext === '.png') mimeType = 'image/png';
      else if (ext === '.svg') mimeType = 'image/svg+xml';
      
      return new Response(data, {
        headers: { 'Content-Type': mimeType }
      });
    } catch (err) {
      console.error(`[Protocol] Failed to read file: ${absolutePath}`, err);
      return new Response('Not Found', { status: 404 });
    }
  });

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
