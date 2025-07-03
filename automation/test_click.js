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
    ],
  });

  page = await browser.newPage();
  await page.goto(
    "https://jitter.video/file/?id=3X4wwy1fOGPZdCZEtOtT5fKS&nodeId=P94KuG7e_o1XPNxmk5ueQ"
  );
}

///class: layerList-module--chevron
//padding-inline-start in .layerList-module--layer--1eb2e
const locators = {
  parentSelectedClass: "layerList-module--selected--54ce4",
  childLayerListClass: "layerList-module--parentInSelection",
};
const enterCount = 100;
const parentSelectedID = "parent-frame-333";

async function runAutomation() {
  //Get selected Element
  let selectedElement = await page
    .locator(`.${locators.parentSelectedClass}`)
    .first();

  if (!selectedElement) {
    return console.error("No selected element found");
  }

  await selectedElement.evaluate((node, newId) => {
    node.id = newId;
  }, parentSelectedID);

  for (let i = 0; i < enterCount; i++) {
    await page.keyboard.press("Enter");
  }
  selectedElement = page.locator(`#${parentSelectedID}`); // refresh the locator

  await selectedElement.click();

  const selectedElementPadding = await GetPaddingInlineStart(selectedElement);

  const parentSelectedElement = await selectedElement.locator("..");
  const startingIndex = parseFloat(
    await parentSelectedElement.getAttribute("data-index")
  );

  //Scan childern elemets
  let ctr = startingIndex + 1;
  while (true) {
    let element = page.locator(`[data-index="${ctr}"] > *:first-child`, {
      hasText: undefined,
    });

    const computedPaddingStart = await element.evaluate((node) => {
      node.scrollIntoView({ behavior: "instant", block: "center" });
      return parseFloat(
        getComputedStyle(node).getPropertyValue("padding-inline-start")
      );
    });

    if (computedPaddingStart <= selectedElementPadding) {
      break;
    }

    // await element.click();

    // const className = await element.getAttribute("class");
    // console.log(
    //   `Element ${ctr} class: ${className} inline-start: ${computedPaddingStart}`
    // );
    // console.log(ctr);
    ctr++;
  }

  // const count = await elements.count();
  // for (let i = 0; i < count; i++) {
  //   const element = elements.nth(i);

  //   await element.evaluate((el) =>
  //     el.scrollIntoView({ behavior: "instant", block: "nearest" })
  //   );
  // }
}

async function GetPaddingInlineStart(locator) {
  return await locator.evaluate((node) =>
    parseFloat(getComputedStyle(node).getPropertyValue("padding-inline-start"))
  );
}

async function printDOM(locator) {
  const domContent = await locator.evaluate((node) => node.outerHTML);
  console.log(domContent);
}

async function changeText() {
  const textButton = page.getByText("#1-View the Journal page:");
  await textButton.click();
  await textButton.press("Enter");
  await page.keyboard.press("Backspace");
  await page.keyboard.insertText("Hello, world!");
}

async function debugPrintChildValues(locatorElement) {
  //
  const parent = locatorElement;
  const children = parent.locator(":scope > *"); // all direct children

  const ccount = await children.count();
  for (let i = 0; i < ccount; i++) {
    const text = await children.nth(i).textContent();
    console.log(`Child ${i}:`, text);
  }

  ///
}

module.exports = { runAutomation, init };
