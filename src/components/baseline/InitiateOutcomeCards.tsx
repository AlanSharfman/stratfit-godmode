/**
 * InitiateOutcomeCards — Strategic system state cards for left panel.
 * Computes 6 outcome scores from risk/confidence curves.
 */
import React, { useMemo } from "react";

// Debug gate
const DEBUG_OUTCOMES =
    typeof window !== "undefined" &&
    import.meta.env.DEV &&
    (window as any).__SF_DEBUG_OUTCOMES__;

export interface OutcomeCardData {
    id: string;
    label: string;
    score: number;
    narrative: string;
    tone: "risk" | "neutral" | "strength" | "strategy";
}

const TONE_COLORS: Record<OutcomeCardData["tone"], string> = {
    risk: "#EF4444",
    neutral: "#22D3EE",
    strength: "#10B981",
    strategy: "#6366F1",
};

function clamp(v: number, min: number, max: number) {
    return Math.max(min, Math.min(max, v));
}

function mean(arr: Float32Array): number {
    if (arr.length === 0) return 0;
    let sum = 0;
    for (let i = 0; i < arr.length; i++) sum += arr[i];
    return sum / arr.length;
}

function max(arr: Float32Array): number {
    if (arr.length === 0) return 0;
    let m = arr[0];
    for (let i = 1; i < arr.length; i++) if (arr[i] > m) m = arr[i];
    return m;
}

function stddev(arr: Float32Array): number {
    if (arr.length < 2) return 0;
    const avg = mean(arr);
    let sum = 0;
    for (let i = 0; i < arr.length; i++) sum += (arr[i] - avg) ** 2;
    return Math.sqrt(sum / arr.length);
}

/**
 * Compute the 6 outcome card scores from risk + confidence curves.
 */
function computeOutcomeCards(
    riskCurve: Float32Array,
    confidenceCurve: Float32Array,
): OutcomeCardData[] {
    const avgRisk = mean(riskCurve);
    const avgConfidence = mean(confidenceCurve);
    const peakRisk = max(riskCurve);
    const riskVolatility = stddev(riskCurve);

    // 1. Survival Resilience — confidence curve average
    const survivalScore = clamp(Math.round(avgConfidence * 100), 0, 100);
    const survivalNarrative =
        survivalScore >= 70
            ? "System shows strong survival probability across horizon."
            : survivalScore >= 50
                ? "Moderate resilience — some pressure zones detected."
                : "Survival corridor under stress — intervention recommended.";

    // 2. Execution Stability — inverse volatility
    const stabilityScore = clamp(Math.round((1 - riskVolatility * 2) * 100), 0, 100);
    const stabilityNarrative =
        stabilityScore >= 70
            ? "Execution metrics are stable and predictable."
            : stabilityScore >= 50
                ? "Some volatility in execution — monitor closely."
                : "High execution volatility — operational risk elevated.";

    // 3. Capital Pressure — from risk average + peak
    const capitalPressure = (avgRisk + peakRisk) / 2;
    const capitalScore = clamp(Math.round((1 - capitalPressure) * 100), 0, 100);
    const capitalNarrative =
        capitalScore >= 70
            ? "Capital position provides adequate runway buffer."
            : capitalScore >= 50
                ? "Capital pressure building — timing window narrowing."
                : "Significant capital pressure — raise timeline critical.";

    // 4. Strategic Flexibility — confidence + inverse risk
    const flexScore = clamp(
        Math.round(((avgConfidence + (1 - avgRisk)) / 2) * 100),
        0,
        100,
    );
    const flexNarrative =
        flexScore >= 70
            ? "High optionality — multiple strategic paths available."
            : flexScore >= 50
                ? "Moderate flexibility — some constraints emerging."
                : "Strategic options constrained — path narrowing.";

    // 5. Market Fragility — peak risk indicator
    const fragilityScore = clamp(Math.round((1 - peakRisk) * 100), 0, 100);
    const fragilityNarrative =
        fragilityScore >= 70
            ? "Market exposure within acceptable bounds."
            : fragilityScore >= 50
                ? "Elevated market sensitivity — monitor externals."
                : "High market fragility — external shocks pose risk.";

    // 6. Operational Load — derived from risk volatility + average
    const loadScore = clamp(
        Math.round((1 - (avgRisk * 0.6 + riskVolatility * 0.4)) * 100),
        0,
        100,
    );
    const loadNarrative =
        loadScore >= 70
            ? "Operational capacity healthy — team bandwidth available."
            : loadScore >= 50
                ? "Moderate operational load — prioritization needed."
                : "Operational strain elevated — capacity risk.";

    const cards: OutcomeCardData[] = [
        {
            id: "survival",
            label: "Survival Resilience",
            score: survivalScore,
            narrative: survivalNarrative,
            tone: survivalScore >= 60 ? "strength" : "risk",
        },
        {
            id: "stability",
            label: "Execution Stability",
            score: stabilityScore,
            narrative: stabilityNarrative,
            tone: stabilityScore >= 60 ? "neutral" : "risk",
        },
        {
            id: "capital",
            label: "Capital Pressure",
            score: capitalScore,
            narrative: capitalNarrative,
            tone: capitalScore >= 60 ? "strength" : "risk",
        },
        {
            id: "flexibility",
            label: "Strategic Flexibility",
            score: flexScore,
            narrative: flexNarrative,
            tone: flexScore >= 60 ? "strategy" : "neutral",
        },
        {
            id: "fragility",
            label: "Market Fragility",
            score: fragilityScore,
            narrative: fragilityNarrative,
            tone: fragilityScore >= 60 ? "neutral" : "risk",
        },
        {
            id: "load",
            label: "Operational Load",
            score: loadScore,
            narrative: loadNarrative,
            tone: loadScore >= 60 ? "strength" : "risk",
        },
    ];

    return cards;
}

interface Props {
    riskCurve: Float32Array;
    confidenceCurve: Float32Array;
}

export default function InitiateOutcomeCards({ riskCurve, confidenceCurve }: Props) {
    const cards = useMemo(() => {
        const result = computeOutcomeCards(riskCurve, confidenceCurve);

        if (DEBUG_OUTCOMES) {
            console.log("[DEBUG_OUTCOMES] Computed scores:", result.map((c) => `${c.label}: ${c.score}`));
        }

        return result;
    }, [riskCurve, confidenceCurve]);

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                padding: 12,
                background: "rgba(8,12,18,0.55)",
                borderRadius: 14,
                border: "1px solid rgba(34,211,238,0.12)",
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
                    marginBottom: 4,
                    textTransform: "uppercase",
                }}
            >
                Strategic System State
            </div>

            {cards.map((card) => {
                const dotColor = TONE_COLORS[card.tone];
                const scoreColor =
                    card.score >= 70
                        ? "#10B981"
                        : card.score >= 50
                            ? "#22D3EE"
                            : "#EF4444";

                return (
                    <div
                        key={card.id}
                        style={{
                            padding: "10px 12px",
                            borderRadius: 10,
                            border: "1px solid rgba(34,211,238,0.18)",
                            background: "rgba(2,6,23,0.50)",
                            boxShadow: `0 0 12px 0 ${dotColor}15 inset`,
                        }}
                    >
                        {/* Header row */}
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                marginBottom: 6,
                            }}
                        >
                            {/* Dot indicator */}
                            <div
                                style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: 999,
                                    background: dotColor,
                                    boxShadow: `0 0 0 3px ${dotColor}30`,
                                    flex: "0 0 auto",
                                }}
                            />
                            {/* Label */}
                            <div
                                style={{
                                    flex: 1,
                                    fontSize: 11,
                                    fontWeight: 700,
                                    letterSpacing: "0.08em",
                                    color: "#E2E8F0",
                                    textTransform: "uppercase",
                                }}
                            >
                                {card.label}
                            </div>
                            {/* Score */}
                            <div
                                style={{
                                    fontSize: 16,
                                    fontWeight: 800,
                                    color: scoreColor,
                                    fontVariantNumeric: "tabular-nums",
                                }}
                            >
                                {card.score}
                            </div>
                        </div>

                        {/* Narrative */}
                        <div
                            style={{
                                fontSize: 11,
                                color: "rgba(226,232,240,0.65)",
                                lineHeight: 1.35,
                            }}
                        >
                            {card.narrative}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
