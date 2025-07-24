import { useState } from "react";
import SetBtn from "./SetBtn";
import LinkList from "./LinkList";

function ReferenceFrameEntry({ onRemove, index, onUpdate }) {
  const [referenceLayerId, setReferenceLayerId] = useState("N/A");
  const [translationLayerId, setTranslationLayerId] = useState("N/A");

  const [showLinkList, setShowLinkList] = useState(false);

  return (
    <div className="flex justify-around text-xs flex-wrap">
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
      <button
        className={`w-full hover:bg-gray-200 font-bold text-md p-1 ${
          showLinkList && "rotate-180"
        }`}
        onClick={() => setShowLinkList(!showLinkList)}
      >
        ^
      </button>
      <div className="p-2">{showLinkList && <LinkList />}</div>
    </div>
  );
}

export default ReferenceFrameEntry;
