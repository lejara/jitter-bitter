const { chromium } = require("playwright");

let page = null;
let browser = null;

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
      "--start-maximized",
    ],
  });

  page = await browser.newPage();
  await page.goto(
    "https://jitter.video/file/?id=IfcoVaKzO4tQsGiLTECTcIbl&nodeId=Rx2ydPZha60gZUMr_W-KW"
  );
}

async function runAutomation() {}

async function changeText() {
  const textButton = page.getByText("#1-View the Journal page:");
  await textButton.click();
  await textButton.press("Enter");
  await page.keyboard.press("Backspace");
  await page.keyboard.insertText("Hello, world!");
}

module.exports = { runAutomation, init };
