// src/components/godmode/GodModePanel.tsx
// STRATFIT — God Mode Toggle Panel
// Phase 10 God Mode Overlays Lock

import { useGodModeStore } from "@/core/store/useGodModeStore";

export default function GodModePanel() {
    const { enabled, showSignals, showPressure, showGhosts, toggle, setLayer } =
        useGodModeStore();

    return (
        <div className="godPanel">
            <button onClick={toggle}>{enabled ? "God Mode On" : "God Mode Off"}</button>

            {enabled && (
                <>
                    <label>
                        <input
                            type="checkbox"
                            checked={showSignals}
                            onChange={(e) => setLayer("showSignals", e.target.checked)}
                        />
                        Signals
                    </label>

                    <label>
                        <input
                            type="checkbox"
                            checked={showPressure}
                            onChange={(e) => setLayer("showPressure", e.target.checked)}
                        />
                        Pressure
                    </label>

                    <label>
                        <input
                            type="checkbox"
                            checked={showGhosts}
                            onChange={(e) => setLayer("showGhosts", e.target.checked)}
                        />
                        Ghost Paths
                    </label>
                </>
            )}
        </div>
    );
}
