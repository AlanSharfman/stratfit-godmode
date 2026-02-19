import { useMemo } from "react";
import { useDiagnosticsStore } from "./DiagnosticsStore";
import { useRenderStore } from "@/render/RenderStore";
import { useSimPhaseStore as useSimulationStore } from "@/state/simPhaseStore";

function fmt(ts: number) {
    const d = new Date(ts);
    return `${d.toLocaleTimeString()}.${String(d.getMilliseconds()).padStart(3, "0")}`;
}

export default function DiagnosticsOverlay() {
    const enabled = useDiagnosticsStore((s) => s.enabled);
    const events = useDiagnosticsStore((s) => s.events);
    const clear = useDiagnosticsStore((s) => s.clear);

    const isContextLost = useRenderStore((s) => (s as any).isContextLost);
    const activeViewId = useRenderStore((s) => (s as any).activeViewId);

    const simPhase = useSimulationStore((s) => (s as any).phase);
    const simMeta = useSimulationStore((s) => (s as any).meta);

    const tail = useMemo(() => events.slice(-20).reverse(), [events]);

    if (!enabled) return null;

    return (
        <div
            style={{
                position: "fixed",
                right: 12,
                bottom: 12,
                width: 420,
                maxHeight: 380,
                overflow: "hidden",
                zIndex: 999999,
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 12,
                background: "rgba(0,0,0,0.75)",
                color: "white",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                fontSize: 12
            }}
        >
            <div style={{ padding: 10, borderBottom: "1px solid rgba(255,255,255,0.12)", display: "flex", justifyContent: "space-between" }}>
                <div>
                    <div style={{ fontWeight: 800 }}>DIAG</div>
                    <div style={{ opacity: 0.8 }}>
                        view={String(activeViewId)} | webglLost={String(!!isContextLost)} | sim={String(simPhase)}
                    </div>
                    {simMeta ? (
                        <div style={{ opacity: 0.8 }}>
                            run={simMeta.runId} prog={Math.round((simMeta.progress || 0) * 100)}% ci={simMeta.confidenceIntervalWidth ?? "-"}
                        </div>
                    ) : null}
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "start" }}>
                    <button onClick={clear} style={{ fontSize: 12 }}>Clear</button>
                    <button onClick={() => useDiagnosticsStore.getState().setEnabled(false)} style={{ fontSize: 12 }}>Hide</button>
                </div>
            </div>

            <div style={{ padding: 10, overflow: "auto", maxHeight: 320 }}>
                {tail.map((e, idx) => (
                    <div key={idx} style={{ marginBottom: 6, opacity: e.level === "error" ? 1 : 0.9 }}>
                        <div style={{ display: "flex", gap: 8 }}>
                            <span style={{ opacity: 0.75 }}>{fmt(e.ts)}</span>
                            <span style={{ fontWeight: 800 }}>{e.level.toUpperCase()}</span>
                            <span style={{ opacity: 0.9 }}>{e.topic}</span>
                        </div>
                        <div style={{ opacity: 0.9 }}>{e.msg}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
