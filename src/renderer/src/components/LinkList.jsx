import { useEffect, useMemo } from "react";
import { useFRDispatch, useFRState } from "../FRProvider";
import Btn from "./btn";
import LinkEntry from "./LinkEntry";

function LinkList({ refFrameIndex }) {
  const { refFrames } = useFRState();
  const dispatch = useFRDispatch();

  const links = useMemo(
    () => refFrames[refFrameIndex]?.links ?? [],
    [refFrames, refFrameIndex]
  );

  function addLink() {
    dispatch({
      type: "UPDATE_LINKS",
      payload: {
        refFrameIndex,
        links: [...links, { id: crypto.randomUUID(), index: links.length }],
      },
    });
  }

  function removeLink(id) {
    let newLinks = links.filter((link) => link.id !== id);
    newLinks = newLinks.map((link, index) => ({ ...link, index: index }));
    dispatch({
      type: "UPDATE_LINKS",
      payload: {
        refFrameIndex,
        links: newLinks,
      },
    });
  }

  function reorder(id, dir) {}

  function getLink(id) {
    return (
      <LinkEntry
        key={id}
        index={links.find((link) => link.id === id).index}
        onRemove={() => removeLink(id)}
        onReorder={(dir) => reorder(id, dir)}
      />
    );
  }

  return (
    <div className="flex flex-col justify-center">
      <Btn onClick={() => addLink()}>Add Link</Btn>
      {links.map((link) => getLink(link.id))}
    </div>
  );
}

export default LinkList;
