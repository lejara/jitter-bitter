import { useFRState } from "../FRProvider";

function PrintState() {
  const state = useFRState();

  return (
    <button
      className=" bg-amber-100"
      onClick={() => {
        console.log(state);
      }}
    >
      Console State
    </button>
  );
}

export default PrintState;
