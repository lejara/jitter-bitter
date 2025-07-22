const { app, BrowserWindow, ipcMain } = require("electron");
const { addLink } = require("./layerLink");

const { getSelectedLayer, getLayerID } = require("./replaceScanner");

ipcMain.handle("get-layer-id", async () => {
  const locator = await getSelectedLayer();
  return await getLayerID(locator);
});

ipcMain.handle("add-link", async () => {
  return await addLink();
});
