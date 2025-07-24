import React from "react";

function Btn({ onClick, children }) {
  return (
    <button
      className="    bg-gray-500       /* background color */
    hover:bg-gray-600  /* darker on hover */
    text-white         /* white text */
    font-semibold      /* semi-bold font */
    py-2               /* vertical padding */
    px-4               /* horizontal padding */
    rounded           
    focus:outline-none /* remove default outline */
    focus:ring-2       /* add ring on focus */
    focus:ring-blue-300
    transition         /* smooth state changes */
    duration-150"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export default Btn;
