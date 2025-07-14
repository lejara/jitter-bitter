const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  runScanReplaceScript: () => ipcRenderer.invoke("run-scan-Replace"),
  runSVGReplaceScript: () => ipcRenderer.invoke("run-svg-Replace"),
});
