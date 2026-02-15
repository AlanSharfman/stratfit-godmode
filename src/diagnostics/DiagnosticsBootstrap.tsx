import { useEffect } from "react";
import { useDiagnosticsStore, diag } from "./DiagnosticsStore";
import { shouldEnableDiagnostics } from "./diagEnable";
import { useRenderStore } from "@/render/RenderStore";
import { useSimulationStore } from "@/sim/SimulationStore";

export default function DiagnosticsBootstrap() {
    const setEnabled = useDiagnosticsStore((s) => s.setEnabled);

    // Pull minimal runtime signals to ensure they are observable
    const isContextLost = useRenderStore((s) => (s as any).isContextLost);
    const activeViewId = useRenderStore((s) => (s as any).activeViewId);

    const simPhase = useSimulationStore((s) => (s as any).phase);
    const simMeta = useSimulationStore((s) => (s as any).meta);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const enable = shouldEnableDiagnostics();
        setEnabled(enable);
        diag("info", "diag", `Diagnostics ${enable ? "ENABLED" : "disabled"}`, {
            via: enable ? "query/localStorage" : "default"
        });
    }, [setEnabled]);

    useEffect(() => {
        diag("info", "render", "Render signal update", { activeViewId, isContextLost });
    }, [activeViewId, isContextLost]);

    useEffect(() => {
        diag("info", "sim", "Simulation signal update", { phase: simPhase, meta: simMeta });
    }, [simPhase, simMeta]);

    return null;
}
