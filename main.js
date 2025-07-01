const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { runAutomation, init } = require("./automation/test_click");

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
ipcMain.handle("run-script", async () => {
  await runAutomation();
});

app.whenReady().then(createWindow);
