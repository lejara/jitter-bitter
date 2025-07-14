const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const parsepathData = require("svg-parse-path-normalized");
const pLimit = require("p-limit");
const { parsePathDataNormalized, pathDataToD } = parsepathData;
const {
  loadFonts,
  parseTextXML,
  createTextXML,
  getSVGPath,
  correctPathLocation,
} = require("./svgWrite");
const { load } = require("text-to-svg");
const {
  saveToJSON,
  getSaveDataPath,
  dumpToJSON,
  sleep,
  dumpSVGString,
  dumpPathToSVG,
  saveSVGString,
  hash,
  combineHashes,
} = require("./jb-utils");
const { randomUUID } = require("crypto");

const textDataPath = path.join(
  __dirname,
  `../Jitter-Bitter-Gitter/export/textData.json`
);
const svgFuzzyMatchPath = path.join(__dirname, "../python/svgFuzzyMatch.py");
const dataDics = {
  jitterSVGDataDictionary: {},
  figmaDataDictionary: {}, //Data we parsed from textData.json
  figmaTextData: {}, // The textData.json. both are linked by figma layer id.
  svgReplacements: {
    UUID: {
      originalSVGHash: "", // svgHash is the original hash of the jitter svg
      toLang: "",
      // figmaKey: "",
      linkedLayersID: [],
      svg: "",
      fileName: "",
      originalPathsHashes: [],
    },
  },
  // userEdits: {
  //   "UUID": {
  //     useForOtherLangs: true,
  //     paths: {
  //       originalPathHash: {
  //         textXML: "",
  //         correctionOptions: "",
  //       },
  //     },
  //   },
  // },
};

async function initDicionaries() {
  // Setup svg data dictionary
  dataDics.jitterSVGDataDictionary = await page.evaluate(async () => {
    let dataDic = {};
    //Note: window.svgsJB is the data we pulled during page load
    const pulledData = window.svgsJB;
    for (const key in pulledData) {
      const url = pulledData[key];
      const res = await fetch(url);
      const blob = await res.blob();
      const svgString = await blob.text();

      const parser = new DOMParser();
      const doc = parser.parseFromString(svgString, "image/svg+xml");

      dataDic[key] = {
        layerId: key,
        blobUrl: url,
        svgHash: 0,
        hashes: [],
        normalizedPaths: [],
        svg: svgString,
        pathArray: Array.from(doc.querySelectorAll("path"))
          .map((pathEl) => pathEl.getAttribute("d"))
          .filter((d) => d !== null),
      };
    }
    return dataDic;
  });

  for (const key in dataDics.jitterSVGDataDictionary) {
    const paths = dataDics.jitterSVGDataDictionary[key].pathArray;
    const normalizedPaths = await Promise.all(
      paths.map((path) => canonicalizePath(path))
    );
    const hashes = await Promise.all(normalizedPaths.map((path) => hash(path)));
    dataDics.jitterSVGDataDictionary[key].hashes = hashes;
    dataDics.jitterSVGDataDictionary[key].svgHash = combineHashes(hashes);
    dataDics.jitterSVGDataDictionary[key].normalizedPaths = normalizedPaths;
  }
  dumpToJSON(dataDics.jitterSVGDataDictionary, "jitterSVGDataDictionary.json");
  // Process Figma textData.json
  //Build hash table for svg paths in text Data
  const figmaTextData = JSON.parse(fs.readFileSync(textDataPath, "utf-8"));
  dataDics.figmaTextData = figmaTextData;
  //Note: the key are the same layer ids in figma.
  for (const key in figmaTextData) {
    let path = figmaTextData[key].svg.path;
    path = canonicalizePath(path);
    dataDics.figmaDataDictionary[key] = {
      text: figmaTextData[key].text,
      hash: await hash(path),
      normalizedPath: path,
    };
  }
  dumpToJSON(dataDics.figmaDataDictionary, "figmaDataDictionary.json");

  //load replacement entries
  try {
    const svgReObj = require(getSaveDataPath("svgReplacements.json"));
    dataDics.svgReplacements = svgReObj;
  } catch (e) {
    dataDics.svgReplacements = {};
  }
}

async function tryToReplace(layerId, layerElement) {
  const jitterBlobData = dataDics.jitterSVGDataDictionary[layerId];

  if (!jitterBlobData) {
    return false;
  }
  //1. first check if we have a figma match of a path

  let matchingPaths = false;
  const toReplace = []; // We can have many paths to replace in a single svg
  for (const figmaLayerKey in dataDics.figmaDataDictionary) {
    const figmaDataDic = dataDics.figmaDataDictionary[figmaLayerKey];

    for (let index = 0; index < jitterBlobData.hashes.length; index++) {
      const jitterHash = jitterBlobData.hashes[index]; //THis hash will always change. depending if we edited the svg.
      if (figmaDataDic.hash === jitterHash) {
        matchingPaths = true;
        toReplace.push({
          figmaDataDic,
          figmaTextData: dataDics.figmaTextData[figmaLayerKey],
          jitterHash,
          jitterHashIndex: index,
        });
      }
    }
  }

  //2. Check if we already edited the layer
  let existingReplacementEntry; // means, did we edit this layer before?
  let existingReplacementEntryUUID;
  for (const uuid in dataDics.svgReplacements) {
    const entry = dataDics.svgReplacements[uuid];
    const found = entry.linkedLayersID.find((l) => l === layerId);
    if (found) {
      existingReplacementEntryUUID = uuid;
      existingReplacementEntry = entry;
      break;
    }
  }
  //NOTE: matchingPaths will only be true if the paths are not edited and can be replaced. True == unedited

  //2.1 We edited this layer before and theres no new edits to be done.
  if (existingReplacementEntry && !matchingPaths) {
    //TODO: here is where we apply user updates
    console.log("Found Replacement SVG. Skipping..");
    return;
  }
  //3. We return here. since we only replace paths that can be edited.
  else if (!matchingPaths) {
    console.log("Found no paths to replace. Skipping...");
    return;
  }

  //--This is now a path or many we didn't touch. That matches with a figma text and could be replaced--

  //4. Check if we can reuse another svgReplacement entry. if we never touched this layer before. (for dups svgs)
  if (!existingReplacementEntry) {
    for (const uuid in dataDics.svgReplacements) {
      const entry = dataDics.svgReplacements[uuid];
      //TODO: add toLang check here
      if (entry.originalSVGHash == jitterBlobData.svgHash) {
        const reusedReplacementEntry = entry;

        await replaceSVG(reusedReplacementEntry, layerElement);
        reusedReplacementEntry.linkedLayersID.push(layerId);
        updateReplacementEntires(reusedReplacementEntry, uuid);
        console.log("Found a dup svg. Reusing Replacement");
        //We are done.
        return;
      }
    }
  }

  //-- Now  we must edit our path. if we can. --

  //5. Go through all our potential paths.
  for (let ctr = 0; ctr < toReplace.length; ctr++) {
    const replaceData = toReplace[ctr];
    //6. Check if we can translate the text. TODO: add csv check here.
    if (true) {
      //-- WE CAN! YAY! lets get to editing ---
      //6.1 Translate it and correct it
      const xml = createTextXML("Hallo", replaceData.figmaTextData);
      const originalPath =
        jitterBlobData.pathArray[replaceData.jitterHashIndex]; //Note: the array of pathArray and the hash index are parallel
      const newPath = await replaceTextOnPath(xml, originalPath);

      let existingSVGString = existingReplacementEntry
        ? existingReplacementEntry.svg
        : jitterBlobData.svg;
      //6.2 Replace our new path data to the old path
      const newSVGString = replacePathInSVGString(
        existingSVGString,
        originalPath,
        newPath
      );

      //7. Write a new svg file and either update or add a svgReplacement entry
      let svgFileName;
      let replacementEntry = {};
      if (existingReplacementEntry) {
        //Update replacement entry
        existingReplacementEntry.originalPathsHashes.push(
          replaceData.jitterHash
        );
        svgFileName = existingReplacementEntry.fileName;
        existingReplacementEntry.svg = newSVGString;
        replacementEntry = existingReplacementEntry;
        updateReplacementEntires(
          replacementEntry,
          existingReplacementEntryUUID
        );
        console.log("Updated Replacement");
      } else {
        //Make a new replacement entry
        const newID = randomUUID();
        svgFileName = newID;
        replacementEntry = {
          originalSVGHash: jitterBlobData.svgHash,
          toLang: "some lang",
          linkedLayersID: [layerId],
          svg: newSVGString,
          // figmaKey:
          fileName: svgFileName,
          originalPathsHashes: [replaceData.jitterHash],
        };
        existingReplacementEntry = replacementEntry;
        updateReplacementEntires(replacementEntry, newID);
        console.log("Created Replacement ");
      }
      saveSVGString(newSVGString, svgFileName);
      await replaceSVG(replacementEntry, layerElement);
    }
  }
}

async function replaceSVG(replacementEntry, layerElement) {
  await layerElement.click();
  // File chooser Example
  const [fileChooser] = await Promise.all([
    page.waitForEvent("filechooser"), // Wait for the file dialog
    page.click(
      '.editorInspector-module--button--6872e[data-sentry-source-file="media.tsx"]'
    ), // Click the button that opens it
  ]);
  await fileChooser.setFiles(
    `${getSaveDataPath(replacementEntry.fileName)}.svg`
  );
}

function updateReplacementEntires(replacementEntry, uuid) {
  dataDics.svgReplacements[uuid] = replacementEntry;

  saveToJSON(dataDics.svgReplacements, "svgReplacements.json");
}

async function replaceTextOnPath(xml, originalPath) {
  const parsedXML = parseTextXML(xml);
  const svgPath = getSVGPath(parsedXML);
  // dumpPathToSVG(svgPath, randomUUID());
  const { path } = await correctPathLocation(originalPath, svgPath);
  return path;
}

function replacePathInSVGString(svgString, oldD, newD) {
  const oldDEsc = escapeForRegExp(oldD);
  // Matches: <path … d="<oldD>" …>
  const re = new RegExp(`(<path\\b[^>]*\\sd=")${oldDEsc}(")`, "g");
  return svgString.replace(re, `$1${newD}$2`);
}

function escapeForRegExp(str) {
  return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
}

async function svgReplace() {
  console.log("Starting scanReplace...");

  //text-to-svg
  //   console.log(page);

  loadFonts();
}

async function svgPathTest() {
  await injectSVGCapture();
  await page.reload();
  await sleep(3000); //TODO: make a proper execution flow

  const svgsJB = await page.evaluate((node) => {
    return window.svgsJB;
  });

  console.log(svgsJB);
  const blob = Object.values(svgsJB)[0];
  //Build hash table for svg paths in jitter svg blobs
  const jitterSVGDataDictionary = await page.evaluate(async (svgJB) => {
    const jitterSVGDataDictionary = {};

    for (const key in svgJB) {
      const url = svgJB[key];
      const res = await fetch(url);
      const blob = await res.blob();
      const svgString = await blob.text();

      const parser = new DOMParser();
      const doc = parser.parseFromString(svgString, "image/svg+xml");

      jitterSVGDataDictionary[key] = {
        layerId: key,
        hashes: [],
        blobUrl: url,
        normalizedPaths: [],
        pathArray: Array.from(doc.querySelectorAll("path"))
          .map((pathEl) => pathEl.getAttribute("d"))
          .filter((d) => d !== null),
      };
    }

    return jitterSVGDataDictionary;
  }, svgsJB);

  for (const key in jitterSVGDataDictionary) {
    const paths = jitterSVGDataDictionary[key].pathArray;
    const normalizedPaths = await Promise.all(
      paths.map((path) => canonicalizePath(path))
    );
    const hashes = await Promise.all(normalizedPaths.map((path) => hash(path)));
    jitterSVGDataDictionary[key].hashes = hashes;
    jitterSVGDataDictionary[key].normalizedPaths = normalizedPaths;
  }
  dumpToJSON(jitterSVGDataDictionary, "jitterSVGDataDictionary.json");
  // console.log(jitterSVGDataDictionary);

  //Build hash table for svg paths in text Data
  const figmaTextData = JSON.parse(fs.readFileSync(textDataPath, "utf-8"));
  //Note: the key are the same layer ids in figma.
  const figmaDataDictionary = {};
  for (const key in figmaTextData) {
    let path = figmaTextData[key].svg.path;
    path = canonicalizePath(path);
    figmaDataDictionary[key] = {
      text: figmaTextData[key].text,
      pathHash: await hash(path),
      normalizedPath: path,
    };
  }
  dumpToJSON(figmaDataDictionary, "figmaDataDictionary.json");
  // console.log(figmaDataDictionary);

  //Compare the hashes of each dictionary with fuzzy matching. NOTE: SLOW!
  // const limit = pLimit(10);
  // const matchPromises = [];
  // for (const key in jitterSVGDataDictionary) {
  //   const jitterNormPaths = jitterSVGDataDictionary[key].normalizedPaths;
  //   for (const jitterNormPath of jitterNormPaths) {
  //     for (const figmaKey in figmaDataDictionary) {
  //       // if (figmaDataDictionary[figmaKey].pathHash === hash) {
  //       matchPromises.push(
  //         limit(async () => {
  //           const { match, distance } = await fuzzyEqual(
  //             jitterNormPath,
  //             figmaDataDictionary[figmaKey].normalizedPath
  //           );
  //           if (match) {
  //             return {
  //               layerId: figmaKey,
  //               svgUrl: jitterSVGDataDictionary[key].blobUrl,
  //               svgPath: jitterSVGDataDictionary[key].pathArray,
  //             };
  //           }
  //           return null;
  //         })
  //       );
  //     }
  //   }
  // }
  // const rawResults = await Promise.all(matchPromises);
  // const matchedSVGs = rawResults.filter((r) => r !== null);

  //Compare the hashes of a path
  const matchedSVGs = [];
  for (const key in jitterSVGDataDictionary) {
    const jitterHashes = jitterSVGDataDictionary[key].hashes;
    for (const hash of jitterHashes) {
      for (const figmaKey in figmaDataDictionary) {
        if (figmaDataDictionary[figmaKey].pathHash === hash) {
          matchedSVGs.push({
            layerId: figmaKey,
            svgUrl: jitterSVGDataDictionary[key].blobUrl,
            svgPath: jitterSVGDataDictionary[key].pathArray,
          });
        }
      }
    }
  }

  for (const match of matchedSVGs) {
    console.log(`MATCHED Layer ID: ${match.layerId}, SVG URL: ${match.svgUrl}`);
  }
}

function createRegexFromSnippet(snippet, flags = "g") {
  return new RegExp(
    snippet
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&") // escape special chars
      .replace(/\s+/g, "\\s*") // collapse whitespace
      .replace(/\\\s/g, "\\s*"), // extra safety
    flags
  );
}

async function injectSVGCapture() {
  await page.route("**/app-*.js", async (route) => {
    const response = await route.fetch();
    let body = await response.text();
    body = replaceJSToSVGCapture(body);

    const container = ` window.svgsJB = {};`;
    body = container + body;
    await route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body,
    });
  });
}

async function blodReplaceTest() {
  await page.addInitScript(() => {
    const OriginalBlob = window.Blob;
    const originalCreateObjectURL = URL.createObjectURL;

    const blobUrlMap = new Map();

    window.Blob = function (parts, options) {
      let newParts = parts;
      let modified = false;

      if (
        options?.type === "image/svg+xml" ||
        parts?.some((p) => typeof p === "string" && p.includes("<svg"))
      ) {
        const text = parts
          .map((p) => (typeof p === "string" ? p : ""))
          .join("");
        if (text.includes("<svg")) {
          const updated = text.replace(/fill="black"/g, 'fill="red"');
          newParts = [updated];
          modified = true;
        }
      }

      const blob = new OriginalBlob(newParts, options);
      blob.__modifiedByYou = modified;
      return blob;
    };
    window.Blob.prototype = OriginalBlob.prototype;

    URL.createObjectURL = function (blob) {
      const url = originalCreateObjectURL(blob);
      if (blob?.__modifiedByYou) {
        console.log("[🎨 SVG Modified] Blob URL:", url);
      }
      blobUrlMap.set(url, blob);
      return url;
    };
  });
}

//Call in a route
function injectConsoleLogForBlob() {
  body = body.replace(
    /function d\(e\)\{const t=\(new XMLSerializer\)\.serializeToString\(e\),n=new Blob\(\[t\],\{type:"image\/svg\+xml"\}\);return URL\.createObjectURL\(n\)\}/,
    `
      function d(e) {
          console.trace();
          const t = (new XMLSerializer).serializeToString(e)
            , n = new Blob([t],{
              type: "image/svg+xml"
          });
          let newurl = URL.createObjectURL(n);
          console.log("[🎨 SVG Modified] Blob URL:", newurl);
          return newurl;
      }
    `
  );
}

function injectPrintforTextSVG() {
  //Bust code only targets missing font text -> svg
  const regexOrg = createRegexFromSnippet("t && m(t.url) !== o && g(t);");

  body = body.replace(
    regexOrg,
    `
          t && m(t.url) !== o && g(t);
          console.log("Node Id: " +  n);
        `
  );

  const promReturnRegex =
    /const\s+a\s*=\s*i\.textImgPromise\.then\(\(e=>void 0===e\?\(h\.delete\(o\),\{actions:\[\{type:"updateObj",objId:n,data:\{_assetsStatus:"missing"\}\}\]\}\):\{actions:\[\{type:"updateObj",objId:n,data:\{_image:e,_assetsStatus:"ready"\}\}\]\}\)\);/;

  body = body.replace(
    promReturnRegex,
    `const a=i.textImgPromise.then((e=>void 0===e?(h.delete(o),{actions:[{type:"updateObj",objId:n,data:{_assetsStatus:"missing"}}]}):(console.log("[✅ image ready]", { objId: n, currentSrc: e?.currentSrc }),{actions:[{type:"updateObj",objId:n,data:{_image:e,_assetsStatus:"ready"}}]})));`
  );
}

function replaceJSToSVGCapture(body) {
  return body.replace(
    /o\.aC\.map\(g\)\.every\(\(e=>void 0===r\[e\]\)\)\?t=e\.imageWithEmptyUserValues:\(v\(e\.svgInfo,i\),t=await p\(e\.svgInfo\.doc\)\);return\{actions:\[\{type:"updateObj",objId:n,data:\{_image:t,_svgInfo:e\.svgInfo,_assetsStatus:"ready"\}\}\]\}/,
    `o.aC.map(g).every((e=>void 0===r[e]))?t=e.imageWithEmptyUserValues:(v(e.svgInfo,i),t=await p(e.svgInfo.doc));window.svgsJB[n]=t?.currentSrc;console.log("🪵 nodeId:", n, "🖼️ image:", t?.currentSrc);return{actions:[{type:"updateObj",objId:n,data:{_image:t,_svgInfo:e.svgInfo,_assetsStatus:"ready"}}]}`
  );
}

//Utils

function canonicalizePath(d, precision = 3) {
  // 1. Parse & normalize in one shot
  //    - defaults: toAbsolute=true, unshort=true
  //    - decimals: -1 means “no rounding” right now
  let pathData = parsePathDataNormalized(d, {
    decimals: 0,
  });

  // 2. Find the minimum X/Y across all commands
  const xs = [],
    ys = [];
  for (let cmd of pathData) {
    for (let i = 0; i < cmd.values.length; i += 2) {
      xs.push(cmd.values[i]);
      ys.push(cmd.values[i + 1]);
    }
  }
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);

  // 3. Translate every point so the shape’s top-left is at (0,0)
  pathData = pathData.map((cmd) => ({
    type: cmd.type,
    values: cmd.values.map((v, i) => (i % 2 === 0 ? v - minX : v - minY)),
  }));

  // 4. Stringify with fixed precision (and no further minification)
  return pathDataToD(pathData, precision, /* minify */ false);
}

function svgFuzzyEqual(d1, d2, { tol = 0.02, samples = 500 } = {}) {
  return new Promise((resolve, reject) => {
    const py = spawn("python", [svgFuzzyMatchPath]);
    const payload = JSON.stringify({ d1, d2, tol, samples });
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

module.exports = {
  svgReplace,
  injectSVGCapture,
  initDicionaries,
  tryToReplace,
};
