const TextToSVG = require("text-to-svg");
const path = require("path");
const fs = require("fs");
const { XMLParser } = require("fast-xml-parser");
const { dumpToJSON } = require("./svgReplace");

//Figma scan
// [
//     "SF Pro — Bold",
//     "SF Pro Text — Semibold",
//     "SF Pro — Regular",
//     "SF Pro — Medium",
//     "Roboto — Medium",
//     "SF Pro — Light",
//     "Open Sans — SemiBold",
//     "SF Pro — Semibold",
//     "Open Sans — Bold",
//     "SF Compact — Medium",
//     "SF Compact Text — Regular",
//     "undefined — undefined",
//     "Proxima Nova — Regular",
//     "SF Pro Display — Regular",
//     "SF Pro Text — Regular",
//     "SF Pro Text — Bold",
//     "Open Sans — Regular",
//     "Inter — Regular",
//     "SF Pro Display — Medium",
//     "SF Pro Display — Bold"
// ]

//NOTE: only use SF Pro Text and SF Pro Display for now
global.loadedFonts;
const fonts = [
  {
    names: ["SF Pro", "SF Pro Text"],
    styles: [
      { name: "Bold", filename: "SF-Pro-Text-Bold.otf" },
      { name: "Light", filename: "SF-Pro-Text-Light.otf" },
      { name: "Regular", filename: "SF-Pro-Text-Regular.otf" },
      { name: "Medium", filename: "SF-Pro-Text-Medium.otf" },
      { name: "Semibold", filename: "SF-Pro-Text-Semibold.otf" },
    ],
  },
  // {
  //   names: ["SF Pro Display"],
  //   styles: [
  //     { name: "Bold", filename: "SF-Pro-Display-Bold.otf" },
  //     { name: "Light", filename: "SF-Pro-Display-Light.otf" },
  //     { name: "Regular", filename: "SF-Pro-Display-Regular.otf" },
  //     { name: "Medium", filename: "SF-Pro-Display-Medium.otf" },
  //     { name: "Semibold", filename: "SF-Pro-Display-Semibold.otf" },
  //   ],
  // },
  // {
  //   names: ["Roboto"],
  //   styles: [
  //     { name: "Bold", filename: "Roboto-Bold.ttf" },
  //     { name: "Regular", filename: "Roboto-Regular.ttf" },
  //     { name: "Medium", filename: "Roboto-Medium.ttf" },
  //   ],
  // },
  // {
  //   names: ["OpenSans"],
  //   styles: [
  //     { name: "Bold", filename: "OpenSans-Bold.ttf" },
  //     { name: "Regular", filename: "OpenSans-Regular.ttf" },
  //     { name: "Semibold", filename: "OpenSans-SemiBold.ttf" },
  //   ],
  // },
  // {
  //   names: ["Proxima Nova"],
  //   styles: [{ name: "Regular", filename: "proximanova_regular.ttf" }],
  // },
  // {
  //   names: ["SF Compact"],
  //   styles: [
  //     { name: "Regular", filename: "SFCompactText-Regular.otf" },
  //     { name: "Medium", filename: "SFCompactText-Medium.otf" },
  //   ],
  // },
];

const fontsFolderPath = path.join(__dirname, "../fonts/SF-Pro.ttf");

function loadFonts() {
  loadedFonts = fonts.map((fontFamily) => {
    return {
      ...fontFamily,
      styles: fontFamily.styles.map((style) => {
        const fontPath = path.join(__dirname, "../fonts", style.filename);
        if (!fs.existsSync(fontPath)) {
          console.error(`Font file not found: ${fontPath}`);
          return;
        }
        return { ...style, font: TextToSVG.loadSync(fontPath) };
      }),
    };
  });
}

function findFontByName(name, style) {
  if (!loadedFonts) {
    console.error("Fonts not loaded. Call loadFonts() first.");
    return null;
  }
  for (const fontFamily of loadedFonts) {
    if (fontFamily.names.includes(name)) {
      const fontStyle = fontFamily.styles.find((s) => s.name === style);
      if (fontStyle) {
        return fontStyle.font;
      }
    }
  }

  //fallback to SF Pro Text Regular
  console.warn(
    `Font style "${style}" not found for "${name}". Using fallback.`
  );

  return getFallbackFont();
}

function getFallbackFont(style = "Regular") {
  if (!loadedFonts) {
    console.error("Fonts not loaded. Call loadFonts() first.");
    return null;
  }

  for (const fontFamily of loadedFonts) {
    if (fontFamily.names.includes("SF Pro")) {
      const fontStyle = fontFamily.styles.find((s) => s.name === style);
      if (fontStyle) {
        return fontStyle.font;
      } else {
        return fontFamily.styles.find((s) => s.name === "Regular").font;
      }
    }
  }
}
// #region XML Parser
function createXML(name, attributes = {}, text = "") {
  const node = { [name]: {} };
}

function parseXML(xmlString) {
  const options = {
    ignoreAttributes: false,
    preserveOrder: true,
    // alwaysCreateTextNode: true,
  };
  const parser = new XMLParser(options);
  try {
    const jsonObj = parser.parse(xmlString);
    return flattenTextNodes(jsonObj);
  } catch (error) {
    console.error("Error parsing XML:", error);
    return null;
  }
}

// recursive helper
function flattenTextNodes(nodes, parentStyle = "regular") {
  const defaults = {
    fontSize: 16,
    font: "SF Pro", // default font
    color: "#000000",
  };

  const out = [];
  for (const node of nodes) {
    // override style if this node has one, otherwise inherit
    const style = node[":@"]?.["@_style"] || parentStyle;

    if (node["#text"] != null) {
      // leaf text node
      out.push({
        text: node["#text"],
        style,
        ...defaults,
      });
    } else if (Array.isArray(node.text)) {
      // nested <text> … </text> child — recurse
      out.push(...flattenTextNodes(node.text, style));
    }
  }
  return out;
}

// #endregion XML Parser

async function writeTextToSVGTest() {
  //TODO: check font size matches figma font
  //TODO: get all fonts

  // loadSync can also take a Buffer if you’ve already read the font:
  const textToSVG = TextToSVG.loadSync(fontsFolderPath);

  const attributes = { fill: "#000", stroke: "black" }; // SVG attributes for the path
  const options = {
    x: 0, // start‐x
    y: 0, // start‐y (baseline)
    fontSize: 48, // units = user coordinates
    anchor: "top", // align your block
    attributes,
  };

  const pathData = textToSVG.getPath("Love you Allen", options);
  // wrap it up:
  const svg = `<svg xmlns="http://www.w3.org/2000/svg">
  <path d="${pathData}" ${Object.entries(attributes)
    .map(([k, v]) => `${k}="${v}"`)
    .join(" ")} />
</svg>`;

  dumpToJSON({ svg: svg }, "textSVG.json");

  //   const fs        = require('fs');
  // const TextToSVG = require('text-to-svg');

  // // 1) load one instance per font/style you need
  // const regular = TextToSVG.loadSync('fonts/Roboto-Regular.ttf');
  // const bold    = TextToSVG.loadSync('fonts/Roboto-Bold.ttf');
  // const italic  = TextToSVG.loadSync('fonts/Roboto-Italic.ttf');

  // // 2) define your “styled runs”
  // const fontSize = 72;
  // const baseline = fontSize;   // y-coordinate of the first line’s baseline
  // const runs = [
  //   { text: 'This ',    font: regular },
  //   { text: 'mixes ',   font: bold    },
  //   { text: 'fonts ',   font: italic  },
  //   { text: 'and styles', font: bold  },
  // ];

  // let x = 0;
  // const pathPieces = runs.map(run => {
  //   // measure width so we know how far to advance x
  //   const { width } = run.font.getMetrics(fontSize);

  //   // getPath returns the raw “d=” string for that run,
  //   // positioned at (x, baseline)
  //   const d = run.font.getPath(run.text, { x, y: baseline, fontSize });

  //   x += width;   // move over for the next run
  //   return d;
  // });

  // // 3) stitch them all together & wrap in one <path>
  // const combinedD = pathPieces.join(' ');
  // const svg = `<?xml version="1.0"?>
  // <svg xmlns="http://www.w3.org/2000/svg">
  //   <path d="${combinedD}" fill="#000" />
  // </svg>`;

  // fs.writeFileSync('out.svg', svg, 'utf8');
  // console.log('✅ out.svg written');
}

const xmlString = `

<text style="italic">this <text style="bold">WOW</text> is italic</text>
`;

const xmlString3 = `
<text> hit </text>
<text style="bold">this is bold</text>
<text style="italic">this is italic</text>
`;
loadFonts();
const parsedXML = parseXML(xmlString3);
// dumpToJSON(parsedXML, "parsedXML.json");
console.log(parsedXML);

// module.exports = { writeTextToSVGTest, loadFonts };
