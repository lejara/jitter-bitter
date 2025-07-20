import React from "react";
import Btn from "./btn";

function SetBtn({ onResponse }) {
  return (
    <Btn
      onClick={async () => {
        const layerId = await window.electronAPI.getLayerID();
        onResponse(layerId);
      }}
    >
      Set
    </Btn>
  );
}

export default SetBtn;
