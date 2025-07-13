const path = require("path");
const fs = require("fs");

function dumpPathToSVG(pathD, filename = "out") {
  const outPath = path.join(__dirname, `../dumps/${filename}.svg`);
  const svg = `<?xml version="1.0"?>
  <svg xmlns="http://www.w3.org/2000/svg">
    <path d="${pathD}" fill="#000000" />
  </svg>`;
  fs.writeFileSync(outPath, svg, "utf8");
  console.log(`✅ ${filename}.svg written`);
}

function dumpSVGString(svgString, filename = "out") {
  const outPath = path.join(__dirname, `../dumps/${filename}.svg`);
  fs.writeFileSync(outPath, svgString, "utf8");
  console.log(`✅ ${filename}.svg written`);
}

function dumpToJSON(data, fileName = "dump.json") {
  const outPath = path.join(__dirname, `../dumps/${fileName}`);
  fs.writeFileSync(
    outPath,
    JSON.stringify(
      data,
      (_key, value) => (typeof value === "bigint" ? value.toString() : value),
      2
    ),
    "utf-8"
  );
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

module.exports = {
  dumpSVGString,
  dumpPathToSVG,
  dumpToJSON,
  sleep,
  printDOM,
  debugPrintChildValues,
};
