import { useMemo } from "react";
import { useAnchorRegistry } from "./AnchorRegistry";
import type { Anchor, AnchorId } from "./types";
import { diag } from "@/diagnostics/DiagnosticsStore";

export function useAnchor(id: AnchorId | null): Anchor | null {
    const anchors = useAnchorRegistry((s) => s.anchors);

    return useMemo(() => {
        if (!id) return null;
        const a = anchors[id];
        if (!a) {
            diag("error", "anchor:missing", id);
            return null;
        }
        return a;
    }, [anchors, id]);
}
