const { BrowserWindow, screen, shell } = require('electron');

let quickWin = null;

function openQuickAdd() {
  if (quickWin && !quickWin.isDestroyed()) {
    quickWin.focus();
    return;
  }
  const cursor = screen.getCursorScreenPoint();
  const display = screen.getDisplayNearestPoint(cursor);
  const w = 480;
  const h = 640;
  const x = Math.round(display.workArea.x + display.workArea.width - w - 24);
  const y = Math.round(display.workArea.y + 60);

  quickWin = new BrowserWindow({
    width: w,
    height: h,
    x,
    y,
    title: 'Quick add — GradeGuard',
    alwaysOnTop: true,
    resizable: true,
    minimizable: false,
    maximizable: false,
    backgroundColor: '#ffffff',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  quickWin.loadURL('https://gradeguard.org/Assignments');

  quickWin.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  quickWin.on('closed', () => {
    quickWin = null;
  });
  quickWin.on('blur', () => {
    if (quickWin && !quickWin.isDestroyed()) quickWin.close();
  });
}

module.exports = { openQuickAdd };
