import React from "react";

export default function App() {
  return (
    <div style={{ padding: "1rem", fontFamily: "sans-serif" }}>
      <h1>Jitter Bitter</h1>
      <img src="/hackor2.png" alt="Logo from public folder" />
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
