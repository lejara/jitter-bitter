const { dumpMapToText, dumpToJSON } = require("../jb-utils");
const { GetLayerName, getSelectedLayers } = require("./replaceScanner");

async function addLink() {
  //get nodes
  const nodes = await global.page.evaluate(() => {
    const nodesObj = {};
    window.all_nodes.forEach((v, k) => {
      nodesObj[k] = {
        id: v.id,
        item: v.item,
      };
    });
    console.log(nodesObj);
    return nodesObj;
  });

  dumpToJSON(nodes, "nodes.json");
  const layerLocators = await getSelectedLayers();
  console.log(layerLocators);
  const count = await layerLocators.count();

  if (count != 2) {
    console.error(`Need selected layer count 2 but got: ${count}`);
    return;
  }
  for (let i = 0; i < count; ++i) {
    const element = layerLocators.nth(i);
    const layerName = await GetLayerName(element);
    console.log(`Element #${i}:`, layerName);
  }
}

module.exports = { addLink };
