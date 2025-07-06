const { chromium } = require("playwright");
const { text } = require("stream/consumers");

///class: layerList-module--chevron
//padding-inline-start in .layerList-module--layer--1eb2e

const enterCount = 100;
const parentSelectedID = "parent-frame-333"; //TODO: make this dynamic
const supportedFonts = ["SF Pro"];

const locators = {
  parentSelectedClass: "layerList-module--selected--54ce4",
  childLayerListClass: "layerList-module--parentInSelection",
  scrollContainerDataAtt: 'data-sentry-element="EditorPanel"',
  missingFontDataAtt: `data-sentry-component="MissingFontInspectorImpl"`,
  missingFontNameClass: `text-module--noWrap--78afb`,
  textSVG: 'path[d^="M5 6V4H19V8H17V6H13V18H15V20H13H11H9V"]',
};

async function scanReplace() {
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
    }); //TODO: try searching in the continer instead of the whole page

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

async function changeText(textButton) {
  await textButton.click();
  await fixMissingFont();
  await textButton.press("Enter");
  await page.keyboard.press("Backspace");
  await page.keyboard.insertText("Hello, world!");
  console.log("Text Replaced");
}

//Note: must be called when an item list is clicked
async function fixMissingFont() {
  const missingFonDiv = await page.locator(`[${locators.missingFontDataAtt}]`);
  if ((await missingFonDiv.count()) > 0) {
    //Font is Missing
    const fontName = await missingFonDiv //TODO: fix this make it actually search the  list
      .locator(`.${locators.missingFontNameClass}`)
      .last()
      .innerText();

    const isFontSupoorted = supportedFonts.find((font) => font === fontName);
    if (!isFontSupoorted) {
      console.log(`Font is not supported: ${fontName}`);
      return;
    }

    await missingFonDiv.locator(`button`).click();
    ctr = 1;
    while (ctr < 100) {
      const fontOption = await page.locator(
        '[id^="downshift-"][id$="-item-' + ctr + '"]'
      );
      const optionName = await fontOption
        .locator(`[data-sentry-element="Ellipsis"]`)
        .innerText();

      if (optionName == fontName) {
        await fontOption.click();
        console.log(`Font fixed: ${fontName}`);
        break;
      }
      ctr++;
    }

    if (ctr >= 100) {
      console.log(`Font not found in options: ${fontName}`);
    }
  }
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

module.exports = { scanReplace };
