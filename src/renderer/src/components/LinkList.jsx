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

  function reorder(id, dir) {
    const link = links.find((link) => link.id === id);

    const from = link.index;
    let to = link.index + dir;

    let newLinks = links.slice();

    to = Math.max(0, Math.min(newLinks.length - 1, to));
    if (from === to) return;

    newLinks.splice(to, 0, newLinks.splice(from, 1)[0]);
    newLinks = newLinks.map((link, index) => ({ ...link, index: index }));

    dispatch({
      type: "UPDATE_LINKS",
      payload: {
        refFrameIndex,
        links: newLinks,
      },
    });
  }

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
    <div className="w-1/2 p-2">
      <div>
        <Btn onClick={() => addLink()}>Add Link</Btn>
      </div>
      <div className="flex flex-wrap">
        {links.map((link) => getLink(link.id))}
      </div>
    </div>
  );
}

export default LinkList;
