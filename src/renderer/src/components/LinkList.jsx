import Btn from "./btn";

function LinkList() {
  return (
    <div>
      <Btn onClick={async () => await window.electronAPI.addLink()}>
        Add Link
      </Btn>
    </div>
  );
}

export default LinkList;
