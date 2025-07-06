const { chromium } = require("playwright");
const { scanReplace } = require("./scanReplace");
const { svgReplace } = require("./svgReplace");

global.page = null;
global.browser = null;

async function init() {
  const userDataDir =
    "C:/Users/Lejara/AppData/Local/Google/Chrome/User Data/Default"; //TODO: make this work for anyone
  browser = await chromium.launchPersistentContext(userDataDir, {
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

  page = await browser.newPage();
  await page.goto("https://jitter.video/file/?id=JcmdWafAfhKG21eEFQSryysG");
}

async function runScanReplace() {
  await scanReplace();
}

async function runSVGReplace() {
  await svgReplace();
}

module.exports = { runScanReplace, runSVGReplace, init };
