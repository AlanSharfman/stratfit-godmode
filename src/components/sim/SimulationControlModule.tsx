import React, { useMemo } from "react";
import "./simulationControlModule.css";

export type SimMode = "Deterministic" | "Probabilistic" | "Multi-run";
export type SimStatus = "Idle" | "Running" | "Complete" | "Error";

type Props = {
  mode: SimMode;
  status: SimStatus;
  isDirty: boolean;
  onModeChange: (mode: SimMode) => void;
  onRun: () => void;
};

function statusTone(status: SimStatus): "neutral" | "cyan" | "emerald" | "red" {
  if (status === "Running") return "cyan";
  if (status === "Complete") return "emerald";
  if (status === "Error") return "red";
  return "neutral";
}

export default function SimulationControlModule({
  mode,
  status,
  isDirty,
  onModeChange,
  onRun,
}: Props) {
  const modes = useMemo<SimMode[]>(
    () => ["Deterministic", "Probabilistic", "Multi-run"],
    []
  );

  const tone = statusTone(status);

  return (
    <div className="sf-simctl" aria-label="Simulation Control Module">
      {/* Mode segmented control */}
      <div className="sf-simctl-seg" role="tablist" aria-label="Simulation Mode">
        {modes.map((m) => {
          const active = m === mode;
          return (
            <button
              key={m}
              type="button"
              className={`sf-simctl-segbtn ${active ? "is-active" : ""}`}
              onClick={() => onModeChange(m)}
              role="tab"
              aria-selected={active}
            >
              {m}
            </button>
          );
        })}
      </div>

      {/* Status */}
      <div className="sf-simctl-status" aria-label="Simulation Status">
        <span
          className={[
            "sf-simctl-dot",
            tone === "cyan" ? "is-cyan" : "",
            tone === "emerald" ? "is-emerald" : "",
            tone === "red" ? "is-red" : "",
            status === "Running" ? "is-pulsing" : "",
          ].join(" ")}
          aria-hidden="true"
        />
        <div className="sf-simctl-statusText">
          <div className="sf-simctl-statusLabel">STATUS</div>
          <div className="sf-simctl-statusValue">{status}</div>
        </div>
      </div>

      {/* Run button */}
      <button
        type="button"
        className="sf-simctl-run"
        onClick={onRun}
        disabled={!isDirty || status === "Running"}
      >
        RUN SIMULATION
      </button>
    </div>
  );
}
