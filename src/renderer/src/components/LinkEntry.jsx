import { useState } from "react";
import SetBtn from "./SetBtn";

function LinkEntry({ index, refFrameIndex, onRemove, onReorder }) {
  const [refID, setRefID] = useState(null);
  const [animationID, setAnimationID] = useState(null);

  return (
    <div className="flex w-full justify-around p-2 items-center">
      <div className="flex flex-col mr-2 items-center">
        <button
          className={`w-full hover:bg-gray-200 font-bold text-sm p-1 `}
          onClick={() => onReorder(-1)}
        >
          ^
        </button>
        <p className=" text-xs font-bold">{index + 1}</p>
        <button
          className={`w-full hover:bg-gray-200 font-bold text-sm p-1 rotate-180`}
          onClick={() => onReorder(1)}
        >
          ^
        </button>
      </div>
      <div>
        <SetBtn onResponse={(layerId) => setRefID(layerId)} />
      </div>

      <p>Ref: {refID ? refID : "Unset"}</p>
      <p>:</p>
      <div>
        <SetBtn onResponse={(layerId) => setAnimationID(layerId)} />
      </div>
      <p>Animtion: {animationID ? animationID : "Unset"}</p>
      <button
        onClick={() => onRemove()}
        className="hover:bg-gray-200 p-4"
      >{`❌`}</button>
    </div>
  );
}

export default LinkEntry;
