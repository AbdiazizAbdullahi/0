const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Database operations
  mainOperation: (operation, ...args) => ipcRenderer.invoke('main-operation', operation, ...args),
  searchCS: (searchTerm, type) => ipcRenderer.invoke('search-cs', searchTerm, type)
  
  // Add more API methods as needed
});
