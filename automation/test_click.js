const { chromium } = require("playwright");
const { text } = require("stream/consumers");

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
    "https://jitter.video/file/?id=5TO8y3oziHnvWxBVLGWwnvvr&nodeId=GhOVX31xagbnTKErKfY3x"
  );
}

///class: layerList-module--chevron
//padding-inline-start in .layerList-module--layer--1eb2e
const locators = {
  parentSelectedClass: "layerList-module--selected--54ce4",
  childLayerListClass: "layerList-module--parentInSelection",
  scrollContainerClass: 'data-sentry-element="EditorPanel"',
  textSVG: 'path[d^="M5 6V4H19V8H17V6H13V18H15V20H13H11H9V"]',
};
const enterCount = 100;
const parentSelectedID = "parent-frame-333";
async function runAutomation() {
  await scan();
}
async function scan() {
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
    let element = await page.locator(`[data-index="${ctr}"] > *:first-child`, {
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

    //Check if is text
    const textSVG = await element.locator(locators.textSVG);

    if ((await textSVG.count()) > 0) {
      console.log("Text SVG found");
      await changeText(element);
    }
    // await element.click();

    // const className = await element.getAttribute("class");
    // console.log(
    //   `Element ${ctr} class: ${className} inline-start: ${computedPaddingStart}`
    // );
    console.log(ctr);
    ctr++;
  }
  console.log(`Scan Done: ${ctr}`);

  // const result = await page.evaluate(
  //   ({ start, threshold, locators }) => {
  //     let ctr = start + 1;

  //     const scrollConatiner = document.querySelector(
  //       `[${locators.scrollContainerClass}]`
  //     );
  //     while (true) {
  //       const container = document.querySelector(`[data-index="${ctr}"]`);
  //       if (!container) break;

  //       const element = container.firstElementChild;
  //       if (!element) break;

  //       // element.scrollIntoView({ behavior: "instant", block: "center" });
  //       scrollConatiner.scrollTop += 2;

  //       const paddingStr = getComputedStyle(element).getPropertyValue(
  //         "padding-inline-start"
  //       );
  //       const padding = parseFloat(paddingStr) || 0;

  //       if (padding <= threshold) break;

  //       ctr++;
  //       console.log(ctr);
  //     }
  //     console.log(`Final count: ${ctr}`);
  //     return ctr;
  //   },
  //   {
  //     start: startingIndex,
  //     threshold: selectedElementPadding,
  //     locators: locators,
  //   }
  // );
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

async function changeText(textButton) {
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
