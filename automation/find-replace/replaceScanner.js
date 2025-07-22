const { chromium } = require("playwright");
// const { text } = require("stream/consumers");
// const { initDicionaries, tryToReplace } = require("./svgReplace");
// const { isTextField } = require("./textReplace");
// const { randomUUID } = require("crypto");

// ///class: layerList-module--chevron
// //padding-inline-start in .layerList-module--layer--1eb2e

// const enterCount = 100;

const locators = {
  parentSelectedClass: "layerList-module--selected--54ce4",
  childLayerListClass: "layerList-module--parentInSelection",
  scrollContainerDataAtt: 'data-sentry-element="EditorPanel"',
  missingFontDataAtt: `data-sentry-component="MissingFontInspectorImpl"`,
  missingFontNameClass: `text-module--noWrap--78afb`,
  textSVG: 'path[d^="M5 6V4H19V8H17V6H13V18H15V20H13H11H9V"]',
  layerName: "layerList-module--name--5d28b",
};

// async function runScanner() {

// }

// async function getSelectedLayer()

// async function GetPaddingInlineStart(locator) {
//   return await locator.evaluate((node) =>
//     parseFloat(getComputedStyle(node).getPropertyValue("padding-inline-start"))
//   );
// }

async function getSelectedLayer() {
  return await page.locator(`.${locators.parentSelectedClass}`).first();
}

async function getSelectedLayers() {
  return await page.locator(`.${locators.parentSelectedClass}`);
}

async function GetLayerName(locator) {
  return await locator.locator(`.${locators.layerName}`).innerText();
}

//Must be layer!
async function getLayerID(locator) {
  return await locator.getAttribute("data-id");
}

module.exports = {
  getSelectedLayer,
  getLayerID,
  getSelectedLayers,
  GetLayerName,
};
