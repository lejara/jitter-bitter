import { useEffect, useMemo, useState } from "react";
import SetBtn from "./SetBtn";
import LinkList from "./LinkList";
import { useFRDispatch, useFRState } from "../FRProvider";

function ReferenceFrameEntry({ onRemove, index }) {
  const { refFrames } = useFRState();
  const dispatch = useFRDispatch();

  const [showLinkList, setShowLinkList] = useState(false);

  const refFrameId = useMemo(
    () => refFrames[index].refFrameId,
    [refFrames, index]
  );
  const translationFrameId = useMemo(
    () => refFrames[index].translationFrameId,
    [refFrames, index]
  );

  function OnUpdate({ newRefFrameId, newTranslationFrameId }) {
    const newRefFrames = refFrames;
    newRefFrames[index].refFrameId = newRefFrameId ? newRefFrameId : refFrameId;
    newRefFrames[index].translationFrameId = newTranslationFrameId
      ? newTranslationFrameId
      : translationFrameId;
    dispatch({ type: "UPDATE_REF_FRAMES", payload: { frames: newRefFrames } });
  }

  return (
    <div className="flex justify-around text-xs flex-wrap p-2">
      <p>{index + 1}.</p>
      <SetBtn onResponse={(layerId) => OnUpdate({ newRefFrameId: layerId })} />

      <p>
        <b>Reference Frame:</b> {refFrameId ? refFrameId : "N/A"}
      </p>

      <p className="text-lg">{`→`}</p>

      <SetBtn
        onResponse={(layerId) => OnUpdate({ newTranslationFrameId: layerId })}
      />
      <p>
        <b> Translation Frame: </b>
        {translationFrameId ? translationFrameId : "N/A"}
      </p>
      <button
        onClick={() => onRemove()}
        className="hover:bg-gray-300 px-4"
      >{`❌`}</button>
      <button
        className={`w-full hover:bg-gray-200 font-bold text-lg p-3 ${
          showLinkList && "rotate-180"
        }`}
        onClick={() => setShowLinkList(!showLinkList)}
      >
        ^
      </button>
      <div className="w-full flex justify-center bg-gray-300">
        {showLinkList && <LinkList refFrameIndex={index} />}
      </div>
    </div>
  );
}

export default ReferenceFrameEntry;
