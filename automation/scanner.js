const { chromium } = require("playwright");
const { text } = require("stream/consumers");
const { initDicionaries, tryToReplace } = require("./svgReplace");
const { isTextField } = require("./textReplace");
const { randomUUID } = require("crypto");

///class: layerList-module--chevron
//padding-inline-start in .layerList-module--layer--1eb2e

const enterCount = 100;

const locators = {
  parentSelectedClass: "layerList-module--selected--54ce4",
  childLayerListClass: "layerList-module--parentInSelection",
  scrollContainerDataAtt: 'data-sentry-element="EditorPanel"',
  missingFontDataAtt: `data-sentry-component="MissingFontInspectorImpl"`,
  missingFontNameClass: `text-module--noWrap--78afb`,
  textSVG: 'path[d^="M5 6V4H19V8H17V6H13V18H15V20H13H11H9V"]',
};

async function runScanner() {
  initDicionaries();
  //Get selected Element
  let selectedElement = await page
    .locator(`.${locators.parentSelectedClass}`)
    .first();

  if (!selectedElement) {
    return console.error("No selected element found");
  }
  const parentSelectedID = `parent-frame-${randomUUID()}`;
  const { layerToSVGs } = await selectedElement.evaluate((node, newId) => {
    //Add an id for later use
    node.id = newId;
    //While we are at it lets get all the window.svgsJB
    //Note: window.svgsJB is the data we pulled during page load
    return { layerToSVGs: window.svgsJB };
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
  const layerListContainer = page.locator(`[data-testid="${"layer-list"}"]`);
  while (true) {
    console.log(ctr);

    const layerSelector = `[data-index="${ctr}"] > *:first-child`;
    let layerElement = null;
    try {
      await page.waitForSelector(layerSelector, {
        timeout: 2000,
      });
      layerElement = await layerListContainer.locator(layerSelector, {
        hasText: undefined,
      });
    } catch (error) {
      break;
    }

    const computedPaddingStart = await layerElement.evaluate((node) => {
      node.scrollIntoView({ behavior: "instant", block: "center" });

      return parseFloat(
        getComputedStyle(node).getPropertyValue("padding-inline-start")
      );
    });
    if (computedPaddingStart <= selectedElementPadding) {
      break;
    }

    const textSVG = await layerElement.locator(locators.textSVG);

    if ((await textSVG.count()) > 0) {
      console.log("Text found");
      // await changeText(element);
    } else {
      const layerId = await layerElement.getAttribute("data-id");
      if (layerToSVGs[layerId]) {
        console.log("Converted SVG Found");
        await tryToReplace(layerId, layerElement);
      }
    }

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

module.exports = { runScanner };
