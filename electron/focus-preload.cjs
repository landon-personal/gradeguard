const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  notifyDone: (minutes) => ipcRenderer.send('focus:done', minutes),
});
