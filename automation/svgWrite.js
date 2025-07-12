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

// #region Font Loading

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
      const fontStyle = fontFamily.styles.find(
        (s) => normalizeString(s.name) === normalizeString(style)
      );
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

function normalizeString(str) {
  return str.trim().toLowerCase();
}

function getFallbackFont(style = "Regular") {
  if (!loadedFonts) {
    console.error("Fonts not loaded. Call loadFonts() first.");
    return null;
  }

  for (const fontFamily of loadedFonts) {
    if (fontFamily.names.includes("SF Pro")) {
      const fontStyle = fontFamily.styles.find(
        (s) => normalizeString(s.name) === normalizeString(style)
      );
      if (fontStyle) {
        return fontStyle.font;
      } else {
        return fontFamily.styles.find((s) => s.name === "Regular").font;
      }
    }
  }
}
// #endregion
// #region XML Parser
function createXML(name, attributes = {}, text = "") {
  const node = { [name]: {} };
}

function parseTextXML(xmlString) {
  const options = {
    ignoreAttributes: false,
    preserveOrder: true,
    // alwaysCreateTextNode: true,
  };
  const parser = new XMLParser(options);
  try {
    const jsonObj = parser.parse(xmlString);
    const nodes = flattenTextNodes(jsonObj);
    for (const node of nodes) {
      node.fontRef = findFontByName(node.font, node.style);
    }
    return nodes;
  } catch (error) {
    console.error("Error parsing XML:", error);
    return null;
  }
}

// recursive helper
function flattenTextNodes(
  nodes,
  parentStyle = "regular",
  parentFontSize = "16",
  parentFont = "SF Pro"
) {
  const defaults = {
    color: "#000000",
  };

  const out = [];
  for (const node of nodes) {
    // override style if this node has one, otherwise inherit
    //TODO: add letter spacing
    const style = node[":@"]?.["@_style"] || parentStyle;
    const fontSize = node[":@"]?.["@_fontSize"] || parentFontSize;
    const font = node[":@"]?.["@_font"] || parentFont;

    if (node["#text"] != null) {
      // leaf text node
      out.push({
        text: node["#text"],
        style,
        fontSize: parseFloat(fontSize),
        font,
        ...defaults,
      });
    } else if (Array.isArray(node.text)) {
      // nested <text> … </text> child — recurse
      out.push(...flattenTextNodes(node.text, style, fontSize, font));
    }
  }
  return out;
}

// #endregion XML Parser
// #region SVG Writing
// const runs =
// [
//   {
//     text: 'hit',
//     style: 'regular',
//     fontSize: 16,
//     font: 'SF Pro',
//     color: '#000000',
//     fontRef: TextToSVG { font: [Font] }
//   },
//   {
//     text: 'this is bold',
//     style: 'bold',
//     fontSize: 16,
//     font: 'SF Pro',
//     color: '#000000',
//     fontRef: TextToSVG { font: [Font] }
//   },
//   {
//     text: 'this is italic',
//     style: 'italic',
//     fontSize: 16,
//     font: 'SF Pro',
//     color: '#000000',
//     fontRef: TextToSVG { font: [Font] }
//   }
// ]
function getSVGPath(runs) {
  let x = 0;
  const pathPieces = runs.map((run) => {
    const { fontRef, fontSize, text } = run;
    let textAdjusted = text.trim() + " ";

    const { width, ascender } = fontRef.getMetrics(textAdjusted, {
      fontSize,
      kerning: true,
    });

    const d = fontRef.getD(textAdjusted, {
      x,
      y: ascender,
      fontSize,
      kerning: true,
    });
    x += width;
    return d;
  });

  const combinedD = pathPieces.join(" ");
  //Debugging output
  // const svg = `<?xml version="1.0"?>
  // <svg xmlns="http://www.w3.org/2000/svg">
  //   <path d="${combinedD}" fill="#000000" />
  // </svg>`;
  // fs.writeFileSync("out.svg", svg, "utf8");
  // console.log("✅ out.svg written");
  //
  return combinedD;
}

// #endregion SVG Writing
const xmlString = `

<text style="italic">this <text style="bold">WOW</text> is italic</text>
`;

const xmlString3 = `
<text style="bold" fontSize="32">LeoMEMS™ Reading</text>
`;
loadFonts();
const parsedXML = parseTextXML(xmlString);
const outputPathsvg = getSVGPath(parsedXML);
// console.log(parsedXML);
// dumpToJSON(parsedXML, "parsedXML.json");
// console.log(outputPathsvg);

module.exports = { loadFonts };
