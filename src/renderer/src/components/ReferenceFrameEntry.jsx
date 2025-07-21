import { useState } from "react";
import SetBtn from "./SetBtn";

function ReferenceFrameEntry({ onRemove, index }) {
  const [referenceLayerId, setReferenceLayerId] = useState("N/A");
  const [translationLayerId, setTranslationLayerId] = useState("N/A");

  return (
    <div className="flex justify-around text-xs">
      <p>{index}.</p>
      <SetBtn onResponse={(layerId) => setReferenceLayerId(layerId)} />

      <p>Reference Frame: {referenceLayerId}</p>
      <p>{`→`}</p>

      <SetBtn onResponse={(layerId) => setTranslationLayerId(layerId)} />
      <p>Translation Frame: {translationLayerId}</p>
      <button
        onClick={() => onRemove()}
        className="hover:bg-gray-300 px-4"
      >{`❌`}</button>
    </div>
  );
}

export default ReferenceFrameEntry;
