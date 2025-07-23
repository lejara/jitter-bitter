import React, { createContext, useReducer, useContext } from "react";
import { initialState, FRReducer } from "./FRReducer";

const StateContext = createContext();
const DispatchContext = createContext();

export const FRProvider = ({ children }) => {
  const [state, dispatch] = useReducer(FRReducer, initialState);
  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>
        {children}
      </DispatchContext.Provider>
    </StateContext.Provider>
  );
};

export const useFRState = () => useContext(StateContext);
export const useFRDispatch = () => useContext(DispatchContext);
