import React, { useRef, useEffect, useState } from "react";
import { initStudioScene, disposeStudioScene } from "./useThreeCanvas";

export default function StudioSceneRoot() {
    const mountRef = useRef<HTMLDivElement | null>(null);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        if (!mountRef.current) return;

        const resizeObserver = new ResizeObserver(entries => {
            const rect = entries[0].contentRect;
            if (rect.width > 0 && rect.height > 0) {
                setReady(true);
            }
        });

        resizeObserver.observe(mountRef.current);

        return () => resizeObserver.disconnect();
    }, []);

    useEffect(() => {
        if (!ready || !mountRef.current) return;

        const dispose = initStudioScene(mountRef.current);

        return () => {
            disposeStudioScene(dispose);
        };
    }, [ready]);

    return <div ref={mountRef} style={{ width: "100%", height: "100%" }} />;
}
