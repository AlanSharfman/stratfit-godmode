import React from "react";
import { Activity } from "lucide-react";
import { useSimulationStore } from "@/state/simulationStore";
import styles from "./SimStatusChip.module.css";

export function SimStatusChip(props: { onClick?: () => void }) {
  const { onClick } = props;
  const status = useSimulationStore((s) => s.simulationStatus);

  const label =
    status === "running"
      ? "SIM: RUNNING"
      : status === "stale"
        ? "SIM: STALE"
        : status === "complete"
          ? "SIM: COMPLETE"
          : "SIM: READY";

  const toneClass =
    status === "running"
      ? styles.running
      : status === "stale"
        ? styles.stale
        : status === "complete"
          ? styles.complete
          : styles.ready;

  return (
    <button
      type="button"
      className={`${styles.chip} ${toneClass}`}
      onClick={onClick ?? (() => window.console.log("[STRATFIT] Simulation console: stub"))}
      aria-label="Simulation status"
    >
      <span className={styles.dot} aria-hidden="true" />
      <Activity className="w-4 h-4" aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
}

export default SimStatusChip;


