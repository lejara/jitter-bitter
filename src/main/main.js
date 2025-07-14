const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const {
  runScanReplace,
  runSVGReplace,
  init,
} = require("../../automation/automation_main");

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

  // win.loadFile("index.html");
  console.log(`DEV TYPE ${process.env.NODE_ENV}`);
  if (process.env.NODE_ENV === "development") {
    win.loadURL("http://localhost:5173/");
  } else {
    win.loadFile(path.join(__dirname, "../../dist/renderer/index.html"));
  }

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
app.on("window-all-closed", () => {
  //TODO: whats this?
  if (process.platform !== "darwin") app.quit();
});
