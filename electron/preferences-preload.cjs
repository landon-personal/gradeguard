const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getSettings: () => ipcRenderer.invoke('prefs:get-settings'),
  setAutoLaunch: (enabled) => ipcRenderer.send('prefs:set-auto-launch', enabled),
  openExternal: (url) => ipcRenderer.send('prefs:open-external', url),
});
