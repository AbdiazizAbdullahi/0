const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Database operations
  mainOperation: (operation, ...args) => ipcRenderer.invoke('main-operation', operation, ...args),
  searchCS: (searchTerm, type, projectId) => ipcRenderer.invoke('search-cs', searchTerm, type, projectId),
  transSearch: (searchTerm, projectId) => ipcRenderer.invoke('trans-search', searchTerm, projectId),
  invoiceSearch: (searchTerm, projectId) => ipcRenderer.invoke('invoice-search', searchTerm, projectId),
  salesSearch: (searchTerm, projectId) => ipcRenderer.invoke('sales-search', searchTerm, projectId)
});