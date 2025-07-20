const { app, BrowserWindow, ipcMain } = require("electron");

const { getSelectedLayer, getLayerID } = require("./replaceScanner");

ipcMain.handle("get-layer-id", async () => {
  const locator = await getSelectedLayer();
  return await getLayerID(locator);
});
