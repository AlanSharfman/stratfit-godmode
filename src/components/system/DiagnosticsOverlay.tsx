import React, { useEffect, useMemo, useState } from "react";
import ComputationMonitor from "@/components/system/ComputationMonitor";

const KEY = "stratfit:diagnostics:visible";

export default function DiagnosticsOverlay() {
  const initial = useMemo(() => {
    try {
      const v = localStorage.getItem(KEY);
      return v === null ? true : v === "1"; // default ON for build/debug
    } catch {
      return true;
    }
  }, []);

  const [visible, setVisible] = useState<boolean>(initial);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "d") return;
      setVisible((v) => !v);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, visible ? "1" : "0");
    } catch {}
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "absolute",
        right: 16,
        bottom: 16,
        width: 420,
        maxWidth: "calc(100vw - 32px)",
        pointerEvents: "auto",
        zIndex: 50,
      }}
    >
      <ComputationMonitor />
    </div>
  );
}
