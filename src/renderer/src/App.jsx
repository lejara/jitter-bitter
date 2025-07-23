import React from "react";
import "../index.css";
import AnimationFrameField from "./components/AnimationFrameField";
import ReferenceFrameList from "./components/ReferenceFrameList";
import { FRProvider } from "./FRProvider";

export default function App() {
  return (
    <div className="p-2 flex justify-around flex-col">
      <div className="flex flex-wrap justify-center ">
        <h1 className="text-5xl font-bold">Jitter Bitter</h1>
        <img
          className=" w-24 h-24 ml-2"
          src="/hackor2.png"
          alt="Logo from public folder"
        />
        <p className="w-full text-center mt-2 font-extrabold">
          For all your Replacing Needs
        </p>
      </div>

      <FRProvider>
        <AnimationFrameField />
        <div>
          <ReferenceFrameList />
        </div>
      </FRProvider>

      {/* <button
        className="bg-red-100"
        onClick={async () => {
          // status.textContent = "Status: Running Scan Replace...";
          await window.electronAPI.runScanReplaceScript();
          // status.textContent = "Status: Scan Replace Done!";
        }}
      >
        Run
      </button> */}
    </div>
  );
}
