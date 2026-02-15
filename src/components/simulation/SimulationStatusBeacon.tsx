import { useEffect, useMemo } from "react";
import { useSimulationStore } from "@/sim/SimulationStore";
import { diag } from "@/diagnostics/DiagnosticsStore";
import styles from "./SimulationStatusBeacon.module.css";

export default function SimulationStatusBeacon() {
    const phase = useSimulationStore((s) => s.phase);
    const meta = useSimulationStore((s) => s.meta);

    useEffect(() => {
        diag("info", "beacon", "mounted");
    }, []);

    useEffect(() => {
        diag("info", "beacon", `phase=${phase}`, { meta });
    }, [phase, meta]);

    const className = useMemo(() => {
        switch (phase) {
            case "MonteCarloRunning":
            case "ScenarioMutating":
                return styles.running;
            case "ConvergenceCheck":
            case "ProjectionUpdate":
                return styles.processing;
            case "Stable":
                return styles.stable;
            case "Error":
                return styles.error;
            default:
                return styles.idle;
        }
    }, [phase]);

    return (
        <div className={styles.container}>
            <div className={`${styles.dot} ${className}`} />
        </div>
    );
}
