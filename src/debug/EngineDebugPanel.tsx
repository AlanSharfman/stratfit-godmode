import React from "react";

export default function EngineDebugPanel() {
    const isDev =
        (typeof process !== "undefined" &&
            process.env &&
            process.env.NODE_ENV === "development") ||
        (import.meta as any)?.env?.DEV;

    if (!isDev) return null;

    const baselineRaw = localStorage.getItem("stratfit.baseline.v1");
    const baseline = baselineRaw ? JSON.parse(baselineRaw) : null;

    const engineResults = (window as any).__STRATFIT_ENGINE__;

    const arr = baseline?.arr ?? baseline?.financial?.arr;
    const burn = baseline?.monthlyBurn ?? baseline?.financial?.monthlyBurn;
    const cash = baseline?.cashOnHand ?? baseline?.financial?.cashOnHand;

    return (
        <div
            style={{
                position: "fixed",
                bottom: 20,
                right: 20,
                background: "#0b1220",
                color: "#7dd3fc",
                padding: "12px 16px",
                borderRadius: 8,
                fontSize: 12,
                zIndex: 9999,
                maxWidth: 280,
                boxShadow: "0 0 0 1px rgba(125,211,252,0.2)"
            }}
        >
            <div><strong>STRATFIT ENGINE DEBUG</strong></div>
            <div>Baseline loaded: {baseline ? "YES" : "NO"}</div>
            <div>Engine results: {engineResults ? "READY" : "NOT READY"}</div>
            {baseline && (
                <div style={{ marginTop: 6 }}>
                    ARR: {arr}
                    Burn: {burn}
                    Cash: {cash}
                </div>
            )}
        </div>
    );
}
