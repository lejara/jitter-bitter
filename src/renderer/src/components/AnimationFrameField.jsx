import React, { useState } from "react";
import SetBtn from "./SetBtn";

function AnimationFrameField() {
  const [layerId, setLayerId] = useState("Unset");
  return (
    <div>
      <SetBtn
        onResponse={(id) => {
          setLayerId(id);
        }}
      ></SetBtn>
      <label> Animation Frame: {layerId}</label>
    </div>
  );
}

export default AnimationFrameField;
