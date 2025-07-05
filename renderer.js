const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  runScript: () => ipcRenderer.invoke("run-script"),
  runFontFix: () => ipcRenderer.invoke("run-font-fix"),
});
