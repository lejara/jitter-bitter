import { useEffect, useState } from "react";
import SetBtn from "./SetBtn";
import LinkList from "./LinkList";
import { useFRDispatch, useFRState } from "../FRProvider";

function ReferenceFrameEntry({ onRemove, index }) {
  const { refFrames } = useFRState();
  const dispatch = useFRDispatch();
  const [referenceLayerId, setReferenceLayerId] = useState(null);
  const [translationLayerId, setTranslationLayerId] = useState(null);

  const [showLinkList, setShowLinkList] = useState(false);

  useEffect(() => {
    OnUpdate();
  }, [referenceLayerId, translationLayerId]);

  function OnUpdate() {
    const newRefFrames = refFrames;
    newRefFrames[index].refFrameId = referenceLayerId;
    newRefFrames[index].translationFrameId = translationLayerId;
    dispatch({ type: "UPDATE_REF_FRAMES", payload: { frames: newRefFrames } });
  }

  return (
    <div className="flex justify-around text-xs flex-wrap">
      <p>{index + 1}.</p>
      <SetBtn onResponse={(layerId) => setReferenceLayerId(layerId)} />

      <p>
        <b>Reference Frame:</b> {referenceLayerId ? referenceLayerId : "N/A"}
      </p>

      <p>{`→`}</p>

      <SetBtn onResponse={(layerId) => setTranslationLayerId(layerId)} />
      <p>
        <b> Translation Frame: </b>
        {translationLayerId ? translationLayerId : "N/A"}
      </p>
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
      <div className="p-2">
        {showLinkList && <LinkList refFrameIndex={index} />}
      </div>
    </div>
  );
}

export default ReferenceFrameEntry;
