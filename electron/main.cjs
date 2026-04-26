const { app, BrowserWindow, shell, globalShortcut, ipcMain, Notification, Menu } = require('electron');
const path = require('path');
const { createTray } = require('./tray.cjs');
const { openFocusOverlay } = require('./focus.cjs');
const { openQuickAdd } = require('./quickadd.cjs');

let mainWin = null;

function createMainWindow() {
  if (mainWin && !mainWin.isDestroyed()) {
    if (mainWin.isMinimized()) mainWin.restore();
    mainWin.show();
    mainWin.focus();
    return mainWin;
  }
  mainWin = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'GradeGuard',
    backgroundColor: '#ffffff',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  mainWin.loadURL('https://gradeguard.org');

  mainWin.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWin.on('closed', () => {
    mainWin = null;
  });

  return mainWin;
}

function setupAutoLaunch() {
  if (process.platform === 'darwin' || process.platform === 'win32') {
    app.setLoginItemSettings({
      openAtLogin: true,
      openAsHidden: false,
    });
  }
}

function setupAppMenu() {
  if (process.platform !== 'darwin') return;
  const template = [
    {
      label: 'GradeGuard',
      submenu: [
        { label: 'About GradeGuard', role: 'about' },
        { type: 'separator' },
        {
          label: 'Quick add assignment',
          accelerator: 'CmdOrCtrl+Shift+G',
          click: () => openQuickAdd(),
        },
        {
          label: 'Start focus session',
          accelerator: 'CmdOrCtrl+Shift+F',
          click: () => openFocusOverlay(),
        },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    { role: 'editMenu' },
    { role: 'viewMenu' },
    { role: 'windowMenu' },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.whenReady().then(() => {
  createMainWindow();
  setupAppMenu();

  createTray({
    openMain: () => createMainWindow(),
    openQuickAdd: () => openQuickAdd(),
    openFocus: () => openFocusOverlay(),
    quit: () => {
      app.isQuitting = true;
      app.quit();
    },
  });

  globalShortcut.register('CommandOrControl+Shift+G', () => openQuickAdd());
  globalShortcut.register('CommandOrControl+Shift+F', () => openFocusOverlay());

  setupAutoLaunch();

  ipcMain.on('focus:done', (_event, minutes) => {
    if (Notification.isSupported()) {
      new Notification({
        title: 'Focus session complete',
        body: `Great job — ${minutes} minutes of focused study.`,
      }).show();
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
    else createMainWindow();
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', (e) => {
  // Keep app alive in tray on macOS even when all windows are closed
  if (process.platform === 'darwin') {
    e.preventDefault?.();
    return;
  }
  app.quit();
});
