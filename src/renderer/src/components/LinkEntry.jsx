import { useState } from "react";
import SetBtn from "./SetBtn";

function LinkEntry({ index, refFrameIndex, onRemove, onReorder }) {
  const [refID, setRefID] = useState(null);
  const [animationID, setAnimationID] = useState(null);

  return (
    <div className="flex justify-center">
      <div className="flex flex-col mr-2">
        <button
          className={`w-full hover:bg-gray-200 font-bold text-sm p-1 `}
          onClick={() => onReorder(1)}
        >
          ^
        </button>
        <button
          className={`w-full hover:bg-gray-200 font-bold text-sm p-1 rotate-180`}
          onClick={() => onReorder(-1)}
        >
          ^
        </button>
      </div>
      <SetBtn onResponse={(layerId) => setRefID(layerId)} />
      <p>Ref: {refID ? refID : "Unset"}</p>
      <p>:</p>
      <SetBtn onResponse={(layerId) => setAnimationID(layerId)} />
      <p>Animtion: {animationID ? animationID : "Unset"}</p>
      <button
        onClick={() => onRemove()}
        className="hover:bg-gray-300 px-4"
      >{`❌`}</button>
    </div>
  );
}

export default LinkEntry;
