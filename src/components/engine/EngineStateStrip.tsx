import React from "react";
import "./engineStateStrip.css";

export type EngineStatus = "Idle" | "Running" | "Complete" | "Error";

export default function EngineStateStrip({ status = "Idle" }: { status?: EngineStatus }) {
  const cls =
    status === "Running"
      ? "sf-engine-strip sf-engine-strip--running"
      : status === "Complete"
      ? "sf-engine-strip sf-engine-strip--complete"
      : status === "Error"
      ? "sf-engine-strip sf-engine-strip--error"
      : "sf-engine-strip sf-engine-strip--idle";

  return <div className={cls} aria-hidden="true" />;
}

