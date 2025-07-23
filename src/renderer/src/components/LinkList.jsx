import { useEffect } from "react";
import { useFRState } from "../FRProvider";
import Btn from "./btn";

function LinkList() {
  const { user } = useFRState();
  useEffect(() => {
    console.log(user);
  }, []);
  return (
    <div>
      <Btn onClick={async () => await window.electronAPI.addLink()}>
        Add Link
      </Btn>
    </div>
  );
}

export default LinkList;
