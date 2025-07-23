import { useState, Fragment } from "react";
import ReferenceFrameEntry from "./ReferenceFrameEntry";
import Btn from "./btn";

function ReferenceFrameList() {
  const [framesList, setFramesList] = useState([]);

  function addFrame() {
    const newFrame = { id: crypto.randomUUID() };
    setFramesList((prev) => [...prev, { ...newFrame, index: prev.length + 1 }]);
  }

  function removeFrame(id) {
    let newList = framesList.filter((frame) => frame.id !== id);
    newList = newList.map((frame, index) => ({ ...frame, index: index + 1 }));
    setFramesList(newList);
  }

  function getFrame(id) {
    return (
      <ReferenceFrameEntry
        key={id}
        index={framesList.find((frame) => frame.id === id).index}
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
          {framesList.map((frame) => getFrame(frame.id))}
        </div>
      </div>
    </div>
  );
}

export default ReferenceFrameList;
