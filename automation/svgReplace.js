const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");
const xxhash = require("xxhash-wasm");
const { spawn } = require("child_process");
const parsepathData = require("svg-parse-path-normalized");
const pLimit = require("p-limit");
const { parsePathDataNormalized, pathDataToD } = parsepathData;
const { writeTextToSVGTest, loadFonts } = require("./svgWrite");
const { load } = require("text-to-svg");

const textDataPath = path.join(
  __dirname,
  `../Jitter-Bitter-Gitter/export/textData.json`
);
const svgFuzzyMatchPath = path.join(__dirname, "../python/svgFuzzyMatch.py");

async function svgReplace() {
  console.log("Starting scanReplace...");

  //File chooser Example
  // const [fileChooser] = await Promise.all([
  //   page.waitForEvent("filechooser"), // Wait for the file dialog
  //   page.click("button#uploadButton"), // Click the button that opens it
  // ]);

  // await fileChooser.setFiles("/absolute/path/to/your/file.png");
  //text-to-svg
  //   console.log(page);
  // await writeTextToSVGTest();
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

async function hash(data) {
  const { h64 } = await xxhash();
  return h64(data);
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
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

module.exports = { svgReplace, dumpToJSON };
