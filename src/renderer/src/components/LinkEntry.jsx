import { useEffect, useMemo, useState } from "react";
import SetBtn from "./SetBtn";
import { useFRDispatch, useFRState } from "../FRProvider";

function LinkEntry({ index, refFrameIndex, onRemove, onReorder }) {
  const { refFrames } = useFRState();
  const dispatch = useFRDispatch();

  const refID = useMemo(
    () => refFrames[refFrameIndex].links[index].refID,
    [index, refFrameIndex, refFrames]
  );

  const animationID = useMemo(
    () => refFrames[refFrameIndex].links[index].animationID,
    [index, refFrameIndex, refFrames]
  );

  function OnUpdate({ newRefID, newAnimationID }) {
    const links = refFrames[refFrameIndex].links;
    links[index].refID = newRefID ? newRefID : refID;
    links[index].animationID = newAnimationID ? newAnimationID : animationID;

    dispatch({
      type: "UPDATE_LINKS",
      payload: {
        refFrameIndex,
        links: links,
      },
    });
  }

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
        <SetBtn onResponse={(layerId) => OnUpdate({ newRefID: layerId })} />
      </div>

      <p>Ref: {refID ? refID : "Unset"}</p>
      <p>:</p>
      <div>
        <SetBtn
          onResponse={(layerId) => OnUpdate({ newAnimationID: layerId })}
        />
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
