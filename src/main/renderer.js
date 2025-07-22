const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  runScanReplaceScript: () => ipcRenderer.invoke("run-scan-Replace"),
  runSVGReplaceScript: () => ipcRenderer.invoke("run-svg-Replace"),

  //find-replace feature
  getLayerID: () => ipcRenderer.invoke("get-layer-id"),
  addLink: () => ipcRenderer.invoke("add-link"),
});
