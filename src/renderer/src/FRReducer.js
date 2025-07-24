const structState = {
  animationID: "",
  refFrames: [
    {
      id: "UUID",
      index: 0,
      refFrameId: "",
      refFramename: "",
      translationFrameId: "",
      translationName: "",
      links: [],
    },
  ],

  //....
};

const initialState = {
  animationID: "",
  refFrames: [],
};

function FRReducer(state, action) {
  switch (action.type) {
    case "UPDATE_REF_FRAMES":
      return { ...state, refFrames: action.payload.frames };
    case "UPDATE_LINKS":
    // return { ...state, theme: state.theme === "light" ? "dark" : "light" };
    default:
      return state;
  }
}

export { FRReducer, initialState };
