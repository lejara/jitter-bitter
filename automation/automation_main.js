const { chromium, firefox } = require("playwright");
const { runScanner } = require("./scanner.js");
const { svgReplace, injectSVGCapture } = require("./svgReplace.js");
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

  global.page = await browser.newPage();
  await injectSVGCapture();
  await page.goto("https://jitter.video/file/?id=TUHiwDO4kF1b3GI15P82XBNR");
}

// async function init() {
//   // Use a persistent Firefox profile (custom folder for session)
//   const userDataDir = path.join(
//     os.homedir(),
//     "AppData",
//     "Roaming",
//     "Mozilla",
//     "Firefox",
//     "Profiles"
//   );

//   // You can use a specific profile folder, or let Playwright create its own
//   const profileDir = path.resolve(userDataDir, "firefox-profile");

//   if (!fs.existsSync(profileDir)) {
//     fs.mkdirSync(profileDir, { recursive: true });
//   }

//   global.browser = await firefox.launchPersistentContext(profileDir, {
//     headless: false,
//     viewport: null,
//     userAgent:
//       "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:115.0) Gecko/20100101 Firefox/115.0",
//     args: [
//       // Firefox-specific launch arguments (generally fewer than Chrome)
//       "--no-sandbox",
//     ],
//   });

//   page = await browser.newPage();
//   await page.goto("https://jitter.video/file/?id=JcmdWafAfhKG21eEFQSryysG");
// }
async function runScanReplace() {
  await runScanner();
}

async function runSVGReplace() {
  await svgReplace();
}

module.exports = { runScanReplace, runSVGReplace, init };
