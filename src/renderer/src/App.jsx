import React from "react";

export default function App() {
  return (
    <div style={{ padding: "1rem", fontFamily: "sans-serif" }}>
      <h1>Hello Electron + React + Vite!</h1>
      <button
        onClick={async () => {
          // status.textContent = "Status: Running Scan Replace...";
          await window.electronAPI.runScanReplaceScript();
          // status.textContent = "Status: Scan Replace Done!";
        }}
      >
        Run
      </button>
    </div>
  );
}
