const { chromium, firefox } = require("playwright");
const { runScanner } = require("./scanner.js");
const { svgReplace, injectSVGCapture } = require("./svgReplace.js");
const { loadFonts } = require("./svgWrite.js");
const os = require("os");
const path = require("path");
const fs = require("fs");

global.page = null;
global.browser = null;

async function init() {
  const userDataDir =
    "C:/Users/Lejara/AppData/Local/Google/Chrome/User Data/Default"; //TODO: make this work for anyone
  global.browser = await chromium.launchPersistentContext(userDataDir, {
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

  loadFonts();
  global.page = await browser.newPage();
  await injectCustomURLForExporting();
  await injectSVGCapture();
  await page.goto("https://jitter.video/file/?id=Zu8mPmRi3Ki4CQtG3ZJuRnkb");
}

async function injectCustomURLForExporting() {
  browser.on("page", async (newPage) => {
    await newPage.waitForLoadState("domcontentloaded").catch(() => {});
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
