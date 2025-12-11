import React from "react";
import Mountain from "./components/engine/Mountain"; 
// or use MountainEngine if you want the canvas spline instead

export default function App() {
  return (
    <div 
      style={{
        width: "100vw",
        height: "100vh",
        background: "#0d0d0d",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
        boxSizing: "border-box",
      }}
    >
      <div 
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "20px",
          overflow: "hidden",
        }}
      >
        <Mountain />
      </div>
    </div>
  );
}
