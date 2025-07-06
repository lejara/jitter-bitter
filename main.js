const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const {
  runScanReplace,
  runSVGReplace,
  init,
} = require("./automation/automation_main");

async function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "renderer.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile("index.html");

  await init(); // Initialize Playwright browser
}

// Listen for renderer signal to run script
ipcMain.handle("run-scan-Replace", async () => {
  await runScanReplace();
});

ipcMain.handle("run-svg-Replace", async () => {
  await runSVGReplace();
});

app.whenReady().then(createWindow);
