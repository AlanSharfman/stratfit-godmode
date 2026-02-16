import React from "react";

type Step = {
    key: string;
    title: string;
    sub: string;
    tone?: "risk" | "neutral" | "strength" | "strategy";
};

const TONE: Record<NonNullable<Step["tone"]>, { dot: string; glow: string }> = {
    neutral: { dot: "#22D3EE", glow: "rgba(34,211,238,0.25)" },
    risk: { dot: "#EF4444", glow: "rgba(239,68,68,0.22)" },
    strength: { dot: "#10B981", glow: "rgba(16,185,129,0.22)" },
    strategy: { dot: "#6366F1", glow: "rgba(99,102,241,0.22)" },
};

export default function BaselineStoryRail() {
    const steps: Step[] = [
        { key: "now", title: "NOW", sub: "Baseline state", tone: "neutral" },
        { key: "runway", title: "RUNWAY", sub: "Compression begins", tone: "risk" },
        { key: "margin", title: "MARGIN", sub: "Volatility zone", tone: "risk" },
        { key: "capital", title: "CAPITAL", sub: "Dependency peak", tone: "strategy" },
        { key: "buffer", title: "BUFFER", sub: "Integrity check", tone: "strength" },
        { key: "horizon", title: "HORIZON", sub: "24m outlook", tone: "neutral" },
    ];

    return (
        <div
            style={{
                border: "1px solid rgba(34,211,238,0.12)",
                borderRadius: 14,
                padding: 12,
                background: "rgba(8,12,18,0.55)",
                backdropFilter: "blur(10px)",
                boxShadow: "0 0 0 1px rgba(255,255,255,0.03) inset",
            }}
        >
            <div
                style={{
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: "0.12em",
                    color: "rgba(226,232,240,0.78)",
                    marginBottom: 10,
                    textTransform: "uppercase",
                }}
            >
                Baseline Journey
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {steps.map((s) => {
                    const tone = TONE[s.tone ?? "neutral"];
                    return (
                        <div
                            key={s.key}
                            style={{
                                display: "flex",
                                gap: 10,
                                alignItems: "flex-start",
                                padding: "10px 10px",
                                borderRadius: 12,
                                border: "1px solid rgba(34,211,238,0.10)",
                                background: "rgba(2,6,23,0.45)",
                            }}
                        >
                            <div
                                style={{
                                    width: 10,
                                    height: 10,
                                    borderRadius: 999,
                                    marginTop: 3,
                                    background: tone.dot,
                                    boxShadow: `0 0 0 4px ${tone.glow}`,
                                    flex: "0 0 auto",
                                }}
                            />
                            <div style={{ flex: 1 }}>
                                <div
                                    style={{
                                        fontSize: 11,
                                        fontWeight: 850,
                                        letterSpacing: "0.14em",
                                        color: "#E2E8F0",
                                        textTransform: "uppercase",
                                        lineHeight: 1.1,
                                    }}
                                >
                                    {s.title}
                                </div>
                                <div
                                    style={{
                                        fontSize: 11,
                                        color: "rgba(226,232,240,0.70)",
                                        marginTop: 4,
                                        lineHeight: 1.15,
                                    }}
                                >
                                    {s.sub}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
