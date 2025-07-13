const TextToSVG = require("text-to-svg");
const path = require("path");
const fs = require("fs");
const { XMLParser } = require("fast-xml-parser");
const { spawn } = require("child_process");
const { dumpToJSON, dumpPathToSVG } = require("./jb-utils");

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
function createTextXML(text, textData) {
  return `<text fontSize="${textData.fontSize}" font="${textData.fontName.family}" style="${textData.fontName.style}"> ${text} </text>`;
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

function correctPathLocation(original, replacement) {
  const svgCorrectionPath = path.join(__dirname, "../python/svgCorrection.py");
  return new Promise((resolve, reject) => {
    const py = spawn("python", [svgCorrectionPath]);
    const payload = JSON.stringify({ d1: original, d2: replacement });
    let stdout = "",
      stderr = "";
    py.stdout.on("data", (chunk) => (stdout += chunk));
    py.stderr.on("data", (chunk) => (stderr += chunk));

    py.on("close", (code) => {
      if (stderr) return reject(new Error(stderr));
      try {
        const result = JSON.parse(stdout);
        resolve(result);
      } catch (err) {
        reject(err);
      }
    });

    // send JSON on stdin and close
    py.stdin.write(payload);
    py.stdin.end();
  });
}

// #endregion SVG Writing
// const xmlString = `

// <text style="italic">this <text style="bold">WOW</text> is italic</text>
// `;

// const xmlString3 = `
// <text style="bold" fontSize="32">LeoMEMS™ READING</text>
// `;
// loadFonts();
// const parsedXML = parseTextXML(xmlString3);
// const outputPathsvg = getSVGPath(parsedXML);
// const corectedPath = correctPathLocation(
//   "M91.9062 47.3906C89.7083 47.3906 87.8021 46.9219 86.1875 45.9844C84.5833 45.0469 83.3438 43.7083 82.4688 41.9688C81.6042 40.2188 81.1719 38.1354 81.1719 35.7188V35.7031C81.1719 33.276 81.6094 31.1979 82.4844 29.4688C83.3594 27.7292 84.599 26.3958 86.2031 25.4688C87.8073 24.5312 89.7083 24.0625 91.9062 24.0625C93.7292 24.0625 95.3542 24.4167 96.7812 25.125C98.2083 25.8333 99.3542 26.8073 100.219 28.0469C101.083 29.276 101.589 30.6927 101.734 32.2969L101.75 32.4375H97.1562L97.0938 32.1719C96.9167 31.3385 96.599 30.6146 96.1406 30C95.6823 29.3854 95.0938 28.9115 94.375 28.5781C93.6667 28.2344 92.8438 28.0625 91.9062 28.0625C90.6979 28.0625 89.651 28.3698 88.7656 28.9844C87.8802 29.599 87.1927 30.4792 86.7031 31.625C86.224 32.7604 85.9844 34.1146 85.9844 35.6875V35.7031C85.9844 37.2865 86.224 38.6562 86.7031 39.8125C87.1927 40.9583 87.8802 41.8438 88.7656 42.4688C89.6615 43.0833 90.7083 43.3906 91.9062 43.3906C92.8125 43.3906 93.6198 43.224 94.3281 42.8906C95.0469 42.5573 95.6458 42.0781 96.125 41.4531C96.6042 40.8177 96.9427 40.0521 97.1406 39.1562L97.1719 39H101.766L101.75 39.1719C101.604 40.7656 101.094 42.1823 100.219 43.4219C99.3542 44.6615 98.2083 45.6354 96.7812 46.3438C95.3542 47.0417 93.7292 47.3906 91.9062 47.3906ZM102.469 47L110.344 24.4531H114.5V28.8281H113.062L107.422 47H102.469ZM106.703 41.5312L107.859 38H118.375L119.531 41.5312H106.703ZM118.797 47L113.156 28.8281V24.4531H115.891L123.75 47H118.797ZM126.062 47V24.4531H135.375C137.062 24.4531 138.505 24.7396 139.703 25.3125C140.911 25.8854 141.833 26.7135 142.469 27.7969C143.115 28.8698 143.438 30.1615 143.438 31.6719V31.7031C143.438 33.1823 143.068 34.5 142.328 35.6562C141.599 36.8125 140.609 37.6354 139.359 38.125L144.109 47H138.766L134.562 38.8281C134.531 38.8281 134.495 38.8281 134.453 38.8281C134.411 38.8281 134.37 38.8281 134.328 38.8281H130.781V47H126.062ZM130.781 35.25H134.859C136.036 35.25 136.953 34.9375 137.609 34.3125C138.276 33.6771 138.609 32.8073 138.609 31.7031V31.6719C138.609 30.5885 138.266 29.7292 137.578 29.0938C136.891 28.4583 135.964 28.1406 134.797 28.1406H130.781V35.25ZM146.562 47V24.4531H155.172C157.432 24.4531 159.359 24.8854 160.953 25.75C162.557 26.6146 163.786 27.8802 164.641 29.5469C165.495 31.2031 165.922 33.224 165.922 35.6094V35.6406C165.922 38.026 165.495 40.0677 164.641 41.7656C163.797 43.4635 162.573 44.7604 160.969 45.6562C159.365 46.5521 157.432 47 155.172 47H146.562ZM151.281 43.0938H154.609C156.016 43.0938 157.203 42.8125 158.172 42.25C159.141 41.6875 159.87 40.8542 160.359 39.75C160.859 38.6458 161.109 37.2812 161.109 35.6562V35.625C161.109 34.0521 160.854 32.724 160.344 31.6406C159.844 30.5573 159.109 29.7396 158.141 29.1875C157.172 28.625 155.995 28.3438 154.609 28.3438H151.281V43.0938ZM168.969 47V24.4531H173.688V47H168.969ZM187.609 47.3906C185.38 47.3906 183.448 46.9167 181.812 45.9688C180.188 45.0208 178.932 43.6771 178.047 41.9375C177.172 40.1875 176.734 38.1198 176.734 35.7344V35.7031C176.734 33.3073 177.177 31.2396 178.062 29.5C178.948 27.7604 180.203 26.4219 181.828 25.4844C183.464 24.5365 185.391 24.0625 187.609 24.0625C189.839 24.0625 191.766 24.5365 193.391 25.4844C195.016 26.4323 196.271 27.776 197.156 29.5156C198.042 31.2448 198.484 33.3073 198.484 35.7031V35.7344C198.484 38.1198 198.042 40.1875 197.156 41.9375C196.271 43.6771 195.016 45.0208 193.391 45.9688C191.776 46.9167 189.849 47.3906 187.609 47.3906ZM187.609 43.3906C188.859 43.3906 189.938 43.0781 190.844 42.4531C191.75 41.8177 192.448 40.9271 192.938 39.7812C193.427 38.6354 193.672 37.2865 193.672 35.7344V35.7031C193.672 34.1302 193.422 32.776 192.922 31.6406C192.432 30.4948 191.729 29.6146 190.812 29C189.906 28.375 188.839 28.0625 187.609 28.0625C186.38 28.0625 185.307 28.3698 184.391 28.9844C183.484 29.599 182.781 30.4792 182.281 31.625C181.792 32.7604 181.547 34.1198 181.547 35.7031V35.7344C181.547 37.2969 181.792 38.651 182.281 39.7969C182.781 40.9427 183.484 41.8281 184.391 42.4531C185.297 43.0781 186.37 43.3906 187.609 43.3906ZM201.531 47V24.4531H206.984L213.391 40.6562H213.484L219.891 24.4531H225.344V47H221.141V31.75H218.953L223.672 25.0781L214.922 47H211.953L203.203 25.0781L207.922 31.75H205.734V47H201.531ZM229.094 47V24.4531H244.031V28.3438H233.812V33.75H243.453V37.4375H233.812V43.1094H244.031V47H229.094ZM247.438 47V24.4531H252.891L259.297 40.6562H259.391L265.797 24.4531H271.25V47H267.047V31.75H264.859L269.578 25.0781L260.828 47H257.859L249.109 25.0781L253.828 31.75H251.641V47H247.438ZM283.234 47.3906C281.453 47.3906 279.896 47.1302 278.562 46.6094C277.24 46.0781 276.198 45.3229 275.438 44.3438C274.677 43.3542 274.25 42.1667 274.156 40.7812L274.141 40.5312H278.594L278.625 40.7031C278.729 41.2865 278.99 41.7917 279.406 42.2188C279.833 42.6354 280.385 42.9635 281.062 43.2031C281.74 43.4323 282.505 43.5469 283.359 43.5469C284.234 43.5469 284.984 43.4323 285.609 43.2031C286.245 42.9635 286.734 42.6302 287.078 42.2031C287.432 41.7656 287.609 41.2604 287.609 40.6875V40.6719C287.609 39.9115 287.307 39.3177 286.703 38.8906C286.109 38.4531 285.109 38.0885 283.703 37.7969L281.328 37.3281C279.109 36.8802 277.438 36.125 276.312 35.0625C275.188 34 274.625 32.6198 274.625 30.9219V30.9062C274.625 29.5312 274.995 28.3333 275.734 27.3125C276.474 26.2812 277.49 25.4844 278.781 24.9219C280.073 24.349 281.552 24.0625 283.219 24.0625C284.958 24.0625 286.458 24.3333 287.719 24.875C288.99 25.4167 289.979 26.1823 290.688 27.1719C291.396 28.1615 291.786 29.3125 291.859 30.625L291.875 30.9219H287.422L287.406 30.7344C287.323 30.1406 287.099 29.6354 286.734 29.2188C286.37 28.7917 285.885 28.4635 285.281 28.2344C284.688 28.0052 284 27.8906 283.219 27.8906C282.417 27.8906 281.724 28.0104 281.141 28.25C280.557 28.4792 280.109 28.7969 279.797 29.2031C279.495 29.6094 279.344 30.0833 279.344 30.625V30.6406C279.344 31.349 279.646 31.9219 280.25 32.3594C280.854 32.7969 281.802 33.1458 283.094 33.4062L285.484 33.8906C287.057 34.2031 288.349 34.6354 289.359 35.1875C290.37 35.7396 291.115 36.4375 291.594 37.2812C292.083 38.1146 292.328 39.1198 292.328 40.2969V40.3125C292.328 41.7604 291.964 43.0156 291.234 44.0781C290.516 45.1302 289.474 45.9479 288.109 46.5312C286.755 47.1042 285.13 47.3906 283.234 47.3906ZM296.875 35.8594V27.4219H293.734V24.4531H303.594V27.4219H300.469V35.8594H296.875ZM304.953 35.8594V24.4531H309.109L311.578 30.5781H311.641L314.094 24.4531H318.25V35.8594H315.125V29.75H313.453L316.906 24.7656L312.547 35.8594H310.656L306.297 24.7656L309.766 29.75H308.078V35.8594H304.953ZM327.469 47V24.4531H336.781C338.469 24.4531 339.911 24.7396 341.109 25.3125C342.318 25.8854 343.24 26.7135 343.875 27.7969C344.521 28.8698 344.844 30.1615 344.844 31.6719V31.7031C344.844 33.1823 344.474 34.5 343.734 35.6562C343.005 36.8125 342.016 37.6354 340.766 38.125L345.516 47H340.172L335.969 38.8281C335.938 38.8281 335.901 38.8281 335.859 38.8281C335.818 38.8281 335.776 38.8281 335.734 38.8281H332.188V47H327.469ZM332.188 35.25H336.266C337.443 35.25 338.359 34.9375 339.016 34.3125C339.682 33.6771 340.016 32.8073 340.016 31.7031V31.6719C340.016 30.5885 339.672 29.7292 338.984 29.0938C338.297 28.4583 337.37 28.1406 336.203 28.1406H332.188V35.25ZM347.969 47V24.4531H362.906V28.3438H352.688V33.75H362.328V37.4375H352.688V43.1094H362.906V47H347.969ZM364.875 47L372.75 24.4531H376.906V28.8281H375.469L369.828 47H364.875ZM369.109 41.5312L370.266 38H380.781L381.938 41.5312H369.109ZM381.203 47L375.562 28.8281V24.4531H378.297L386.156 47H381.203ZM388.469 47V24.4531H397.078C399.339 24.4531 401.266 24.8854 402.859 25.75C404.464 26.6146 405.693 27.8802 406.547 29.5469C407.401 31.2031 407.828 33.224 407.828 35.6094V35.6406C407.828 38.026 407.401 40.0677 406.547 41.7656C405.703 43.4635 404.479 44.7604 402.875 45.6562C401.271 46.5521 399.339 47 397.078 47H388.469ZM393.188 43.0938H396.516C397.922 43.0938 399.109 42.8125 400.078 42.25C401.047 41.6875 401.776 40.8542 402.266 39.75C402.766 38.6458 403.016 37.2812 403.016 35.6562V35.625C403.016 34.0521 402.76 32.724 402.25 31.6406C401.75 30.5573 401.016 29.7396 400.047 29.1875C399.078 28.625 397.901 28.3438 396.516 28.3438H393.188V43.0938ZM410.875 47V24.4531H415.594V47H410.875ZM419.344 47V24.4531H423.469L435.734 42.0938L431.781 39.1094H433.75V24.4531H438.453V47H434.359L422.078 29.25L426.031 32.2344H424.047V47H419.344ZM452.375 47.3906C450.688 47.3906 449.172 47.125 447.828 46.5938C446.495 46.0625 445.359 45.2917 444.422 44.2812C443.484 43.2604 442.766 42.026 442.266 40.5781C441.766 39.1302 441.516 37.4896 441.516 35.6562V35.6406C441.516 33.224 441.953 31.1562 442.828 29.4375C443.703 27.7083 444.943 26.3802 446.547 25.4531C448.161 24.526 450.068 24.0625 452.266 24.0625C454.078 24.0625 455.677 24.3854 457.062 25.0312C458.448 25.6667 459.573 26.5417 460.438 27.6562C461.312 28.7708 461.875 30.0365 462.125 31.4531L462.172 31.6719H457.438L457.375 31.5156C457 30.4219 456.375 29.5729 455.5 28.9688C454.625 28.3646 453.552 28.0625 452.281 28.0625C451.042 28.0625 449.974 28.3594 449.078 28.9531C448.193 29.5365 447.51 30.3906 447.031 31.5156C446.562 32.6406 446.328 34 446.328 35.5938V35.6094C446.328 36.8281 446.469 37.9219 446.75 38.8906C447.031 39.849 447.438 40.6615 447.969 41.3281C448.51 41.9948 449.156 42.5052 449.906 42.8594C450.667 43.2135 451.516 43.3906 452.453 43.3906C453.474 43.3906 454.375 43.2031 455.156 42.8281C455.948 42.4427 456.568 41.9062 457.016 41.2188C457.474 40.5208 457.724 39.7083 457.766 38.7812L457.781 38.4531H452.625V34.9375H462.375V37.5312C462.375 39.0625 462.146 40.4375 461.688 41.6562C461.24 42.875 460.583 43.9115 459.719 44.7656C458.865 45.6198 457.818 46.2708 456.578 46.7188C455.339 47.1667 453.938 47.3906 452.375 47.3906Z",
//   outputPathsvg
// ).then(({ path }) => {
//   // console.log(correctedPath);
//   dumpPathToSVG(path);
// });

// console.log(parsedXML);
// dumpToJSON(parsedXML, "parsedXML.json");
// console.log(corectedPath);

module.exports = {
  loadFonts,
  correctPathLocation,
  getSVGPath,
  parseTextXML,
  createTextXML,
};
