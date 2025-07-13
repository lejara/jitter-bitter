const { chromium } = require("playwright");

const locators = {
  textSVG: 'path[d^="M5 6V4H19V8H17V6H13V18H15V20H13H11H9V"]',
};

//NOTE: BORKEN
async function isTextField(layerElement) {
  const textSVG = await layerElement.locator(locators.textSVG);

  if ((await textSVG.count()) > 0) {
    return true;
  }
  return false;
}

async function tryChangeText(textButton) {
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

module.exports = { tryChangeText, isTextField };
