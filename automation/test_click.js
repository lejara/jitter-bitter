const { chromium } = require("playwright");

let page = null; // Global page variable to be used in runAutomation

async function init() {
  const browser = await chromium.launch({ headless: false }); // show browser
  page = await browser.newPage();
  await page.goto("https://example.com");
}

async function runAutomation() {
  await page.goto("https://www.youtube.com/");

  // // Click a button
  // await page.click("button#submit");

  // // Fill a text input
  // await page.fill('input[name="username"]', "myUser");

  // // Modify DOM element directly
  // await page.evaluate(() => {
  //   const el = document.querySelector("#title");
  //   if (el) el.textContent = "Changed Title!";
  // });

  // await browser.close();
}

module.exports = { runAutomation, init };
