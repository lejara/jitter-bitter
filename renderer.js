const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  runScript: () => ipcRenderer.invoke("run-script"),
});
