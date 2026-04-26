const { BrowserWindow, screen, Notification } = require('electron');
const path = require('path');

let focusWin = null;

function openFocusOverlay() {
  if (focusWin && !focusWin.isDestroyed()) {
    focusWin.focus();
    return;
  }
  const display = screen.getPrimaryDisplay();
  const { width, height } = display.size;
  focusWin = new BrowserWindow({
    width,
    height,
    x: 0,
    y: 0,
    frame: false,
    fullscreen: true,
    alwaysOnTop: true,
    skipTaskbar: false,
    backgroundColor: '#0b1020',
    title: 'GradeGuard — focus session',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'focus-preload.cjs'),
    },
  });
  focusWin.loadFile(path.join(__dirname, 'focus.html'));
  focusWin.on('closed', () => {
    focusWin = null;
  });
}

module.exports = { openFocusOverlay };
