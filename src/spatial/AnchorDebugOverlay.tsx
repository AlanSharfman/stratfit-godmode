import { useMemo } from "react";
import { useAnchorRegistry } from "./AnchorRegistry";
import { useDiagnosticsStore } from "@/diagnostics/DiagnosticsStore";

export default function AnchorDebugOverlay() {
    const enabled = useDiagnosticsStore((s) => s.enabled);
    const anchors = useAnchorRegistry((s) => s.anchors);

    const list = useMemo(() => {
        const arr = Object.values(anchors);
        arr.sort((a, b) => a.priority - b.priority || a.id.localeCompare(b.id));
        return arr.slice(0, 50);
    }, [anchors]);

    if (!enabled) return null;

    return (
        <div
            style={{
                position: "fixed",
                left: 12,
                bottom: 12,
                width: 380,
                maxHeight: 320,
                overflow: "auto",
                zIndex: 999998,
                border: "1px solid rgba(255,255,255,0.18)",
                borderRadius: 12,
                background: "rgba(0,0,0,0.65)",
                color: "white",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                fontSize: 12,
                padding: 10
            }}
        >
            <div style={{ fontWeight: 900, marginBottom: 6 }}>ANCHORS (top 50)</div>
            {list.map((a) => (
                <div key={a.id} style={{ marginBottom: 6, opacity: 0.92 }}>
                    <div style={{ fontWeight: 800 }}>
                        [{a.priority}] {a.id} {a.label ? `— ${a.label}` : ""}
                    </div>
                    <div style={{ opacity: 0.8 }}>
                        norm: {a.norm.x.toFixed(2)},{a.norm.y.toFixed(2)},{a.norm.z.toFixed(2)}
                    </div>
                    <div style={{ opacity: 0.8 }}>
                        world: {a.world.x.toFixed(1)},{a.world.y.toFixed(1)},{a.world.z.toFixed(1)}
                    </div>
                </div>
            ))}
        </div>
    );
}
