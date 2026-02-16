// src/components/cinematic/CinematicToggle.tsx
// STRATFIT — Cinematic Toggle UI
// Phase 9 Cinematic Camera Lock

import { useCinematicStore } from "@/core/store/useCinematicStore";

export default function CinematicToggle() {
    const mode = useCinematicStore((s) => s.mode);
    const setMode = useCinematicStore((s) => s.setMode);

    return (
        <div className="cinematicToggle">
            <button
                className={mode === "explore" ? "active" : ""}
                onClick={() => setMode("explore")}
            >
                Explore
            </button>
            <button className={mode === "demo" ? "active" : ""} onClick={() => setMode("demo")}>
                Demo
            </button>
        </div>
    );
}
