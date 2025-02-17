const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  getEntries: () => ipcRenderer.invoke("get-entries"),
  createEntry: (entryData) => ipcRenderer.invoke("create-entry", entryData),
  updateEntry: (entryId, entryData) => ipcRenderer.invoke("update-entry", entryId, entryData),
  showMessageBox: (message) => ipcRenderer.invoke("show-message-box", message),
  deleteEntry: (entryId) => ipcRenderer.invoke("delete-entry", entryId),
});
