const { chromium } = require("playwright");

async function svgReplace() {
  console.log("Starting scanReplace...");
  //   console.log(page);
  await injectRoute();
  await page.reload();
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

async function injectRoute() {
  await page.route("**/app-*.js", async (route) => {
    const response = await route.fetch();
    let body = await response.text();
    body = injectSVGCreation(body);
    await route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body,
    });
  });
}

async function blodReplace() {
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

function injectSVGCreation(body) {
  return body.replace(
    /o\.aC\.map\(g\)\.every\(\(e=>void 0===r\[e\]\)\)\?t=e\.imageWithEmptyUserValues:\(v\(e\.svgInfo,i\),t=await p\(e\.svgInfo\.doc\)\);return\{actions:\[\{type:"updateObj",objId:n,data:\{_image:t,_svgInfo:e\.svgInfo,_assetsStatus:"ready"\}\}\]\}/,
    `o.aC.map(g).every((e=>void 0===r[e]))?t=e.imageWithEmptyUserValues:(v(e.svgInfo,i),t=await p(e.svgInfo.doc));console.log("🪵 nodeId:", n, "🖼️ image:", t?.currentSrc);return{actions:[{type:"updateObj",objId:n,data:{_image:t,_svgInfo:e.svgInfo,_assetsStatus:"ready"}}]}`
  );
}

module.exports = { svgReplace };
