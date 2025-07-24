import ReferenceFrameEntry from "./ReferenceFrameEntry";
import Btn from "./btn";
import { useFRDispatch, useFRState } from "../FRProvider";

function ReferenceFrameList() {
  const { refFrames } = useFRState();
  const dispatch = useFRDispatch();

  function addFrame() {
    const newFrame = { id: crypto.randomUUID() };
    const prev = refFrames;
    dispatch({
      type: "UPDATE_REF_FRAMES",
      payload: { frames: [...prev, { ...newFrame, index: prev.length }] },
    });
  }

  function removeFrame(id) {
    let newList = refFrames.filter((frame) => frame.id !== id);
    newList = newList.map((frame, index) => ({ ...frame, index: index }));
    dispatch({
      type: "UPDATE_REF_FRAMES",
      payload: { frames: newList },
    });
  }

  function getFrame(id) {
    return (
      <ReferenceFrameEntry
        key={id}
        index={refFrames.find((frame) => frame.id === id).index}
        onRemove={() => removeFrame(id)}
      ></ReferenceFrameEntry>
    );
  }

  return (
    <div className="mt-2 p-4">
      {/* <h2 className="text-lg">Reference Frame</h2> */}
      <div className="">
        <Btn onClick={() => addFrame()}> Add Reference Frame </Btn>
      </div>
      <div className="bg-gray-100 overflow-y-auto">
        <div className="p-4">
          {refFrames.map((frame) => getFrame(frame.id))}
        </div>
      </div>
    </div>
  );
}

export default ReferenceFrameList;
