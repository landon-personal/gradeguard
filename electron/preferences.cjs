const { BrowserWindow, ipcMain, shell, app } = require('electron');
const path = require('path');
const fs = require('fs');

let prefsWin = null;

function getFirstLaunchFlagPath() {
  return path.join(app.getPath('userData'), '.first-launch-shown');
}

function isFirstLaunch() {
  return !fs.existsSync(getFirstLaunchFlagPath());
}

function markFirstLaunchShown() {
  try {
    fs.writeFileSync(getFirstLaunchFlagPath(), new Date().toISOString());
  } catch (_) {
    // best effort
  }
}

function openPreferences({ welcome = false } = {}) {
  if (prefsWin && !prefsWin.isDestroyed()) {
    prefsWin.focus();
    return prefsWin;
  }
  prefsWin = new BrowserWindow({
    width: 620,
    height: 700,
    minWidth: 480,
    minHeight: 540,
    title: welcome ? 'Welcome to GradeGuard' : 'GradeGuard Preferences',
    backgroundColor: '#f8fafc',
    resizable: true,
    minimizable: true,
    maximizable: false,
    fullscreenable: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preferences-preload.cjs'),
    },
  });
  prefsWin.loadFile(path.join(__dirname, 'preferences.html'));
  prefsWin.on('closed', () => {
    prefsWin = null;
  });
  if (welcome) markFirstLaunchShown();
  return prefsWin;
}

function registerIpc() {
  ipcMain.handle('prefs:get-settings', () => {
    const loginItem = app.getLoginItemSettings();
    return {
      openAtLogin: loginItem.openAtLogin,
      firstLaunch: isFirstLaunch(),
      version: app.getVersion(),
    };
  });

  ipcMain.on('prefs:set-auto-launch', (_event, enabled) => {
    app.setLoginItemSettings({
      openAtLogin: !!enabled,
      openAsHidden: false,
    });
  });

  ipcMain.on('prefs:open-external', (_event, url) => {
    if (typeof url === 'string' && /^https?:\/\//.test(url)) {
      shell.openExternal(url);
    }
  });
}

module.exports = { openPreferences, isFirstLaunch, registerIpc };
