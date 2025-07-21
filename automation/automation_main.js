const { chromium, firefox } = require("playwright");
const { runScanner } = require("./scanner.js");
const { svgReplace, injectSVGCapture } = require("./svgReplace.js");
const { loadFonts } = require("./svgWrite.js");
const os = require("os");
const path = require("path");
const fs = require("fs");

global.page = null;
global.browser = null;
const downloadsFolder = path.join(os.homedir(), "Downloads");

async function init() {
  // const userDataDir = path.join(
  //   process.env.LOCALAPPDATA || path.join(process.env.HOME, ".config"),
  //   "Google/Chrome/User Data"
  // );

  const localAppData =
    process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local");

  const userDataDir = path.join(
    localAppData,
    "Google",
    "Chrome",
    "User Data",
    "Default"
  );

  // Resolve the two Program Files roots (on Win, these env vars always exist)
  const programFilesx86 =
    process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)";
  const programFiles = process.env["ProgramFiles"] || "C:\\Program Files";

  // Build the two candidate paths
  const chromeCandidates = [
    path.join(programFilesx86, "Google", "Chrome", "Application", "chrome.exe"),
    path.join(programFiles, "Google", "Chrome", "Application", "chrome.exe"),
  ];

  // Pick the first one that exists
  const chromeExecutable = chromeCandidates.find((p) => fs.existsSync(p));

  if (!fs.existsSync(downloadsFolder))
    fs.mkdirSync(downloadsFolder, { recursive: true });

  global.browser = await chromium.launchPersistentContext(userDataDir, {
    executablePath: chromeExecutable,
    downloadsPath: downloadsFolder,
    acceptDownloads: true,
    headless: false,
    viewport: null,
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
    args: [
      "--disable-blink-features=AutomationControlled",
      "--no-sandbox",
      "--disable-web-security",
      "--disable-features=IsolateOrigins,site-per-process",
      "--disable-site-isolation-trials",
      "--disable-extensions",
    ],
  });

  await global.browser.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", {
      get: () => false,
    });
  });

  loadFonts();
  global.page = await global.browser.newPage();
  await injectCustomURLForExporting();

  // await injectSVGCapture();
  await page.goto("https://jitter.video/file/?id=Zu8mPmRi3Ki4CQtG3ZJuRnkb");
}

async function injectCustomURLForExporting() {
  browser.on("page", async (newPage) => {
    await newPage.waitForLoadState("domcontentloaded").catch(() => {});

    newPage.on("download", async (download) => {
      const filename = download.suggestedFilename(); // the real name
      const savePath = path.join(downloadsFolder, filename);
      await download.saveAs(savePath); // copy+rename
      console.log(`✅ Downloaded “${filename}” → ${savePath}`);
    });

    let newUrl = newPage.url();
    if (
      newUrl.startsWith("https://jitter.video/export") &&
      !newUrl.includes("fromWcid=h264HighHwAAC")
    ) {
      newUrl = `${newUrl}&fps=30&fromWcid=h264HighHwAAC&fromProfile=mp4&wcid=h264HighHwOpus`;
      console.log("➜ Rewritten URL:", newUrl);

      await newPage.goto(newUrl);
    }
  });
}

async function runScanReplace() {
  await runScanner();
}

async function runSVGReplace() {
  await svgReplace();
}

module.exports = { runScanReplace, runSVGReplace, init };
