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
      links: [
        {
          id: "",
          index: 0,
          refID: "",
          animationID: "",
          options: { typeTest: false },
        },
      ],
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
      return {
        ...state,
        refFrames: action.payload.frames.map((frames) => frames),
      };
    case "UPDATE_LINKS":
      const { refFrameIndex, links } = action.payload;
      return {
        ...state,
        refFrames: state.refFrames.map((rf, i) =>
          i === refFrameIndex ? { ...rf, links: links } : rf
        ),
      };
    default:
      return state;
  }
}

export { FRReducer, initialState };
