import React, { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./StudioPage.module.css";

import StudioSceneRoot from "@/components/studio/StudioSceneRoot";
import StudioStage from "@/scene/studio/StudioStage";

import { ControlDeck, ControlBoxConfig } from "@/components/ControlDeck";
import { TopControlBar, type ScenarioTab, type Horizon, type RampType } from "@/components/strategy-studio/TopControlBar";
import { TimelineScrubber } from "@/components/strategy-studio/TimelineScrubber";
import SimulationActivityPanel from "@/components/strategy-studio/SimulationActivityPanel";
import { DeltaSummaryPanel } from "@/components/strategy-studio/DeltaSummaryPanel";
import { useAnchorRegistry } from "@/spatial/AnchorRegistry";
import type { LeverState } from "@/logic/calculateMetrics";

export default function StudioPage() {

    // ============================================================
    // SPATIAL ANCHORS
    // ============================================================
    useEffect(() => {
        const reg = useAnchorRegistry.getState();
        reg.upsertAnchor("origin", { x: 0, y: 0, z: 0 }, 1, "Origin");
        reg.upsertAnchor("timelineStart", { x: 0, y: 0, z: 0.1 }, 1, "Timeline Start");
        reg.upsertAnchor("timelineEnd", { x: 1, y: 0, z: 0.1 }, 1, "Timeline End");
        reg.upsertAnchor("p50_mid", { x: 0.5, y: 0, z: 0.4 }, 2, "P50 Mid");
    }, []);

    // ============================================================
    // LEVER STATE
    // ============================================================
    const [levers, setLevers] = useState<LeverState>({
        demandStrength: 60,
        expansionVelocity: 45,
        pricingPower: 50,
        costDiscipline: 55,
        operatingDrag: 35,
        marketVolatility: 30,
        executionRisk: 25,
        fundingPressure: 20,
        hiringIntensity: 40,
    });

    const onLeverChange = useCallback((id: keyof LeverState, value: number) => {
        setLevers(prev => ({ ...prev, [id]: value }));
    }, []);

    // ============================================================
    // CONTROL DECK CONFIG
    // ============================================================
    const controlBoxes: ControlBoxConfig[] = useMemo(() => [
        {
            id: "growth",
            title: "GROWTH VECTOR",
            sliders: [
                { id: "demandStrength", label: "Demand Strength", value: levers.demandStrength, min: 0, max: 100 },
                { id: "pricingPower", label: "Pricing Power", value: levers.pricingPower, min: 0, max: 100 },
                { id: "expansionVelocity", label: "Expansion Velocity", value: levers.expansionVelocity, min: 0, max: 100 },
            ],
        },
        {
            id: "efficiency",
            title: "OPERATIONAL ENGINE",
            sliders: [
                { id: "costDiscipline", label: "Cost Discipline", value: levers.costDiscipline, min: 0, max: 100 },
                { id: "hiringIntensity", label: "Hiring Intensity", value: levers.hiringIntensity, min: 0, max: 100 },
                { id: "operatingDrag", label: "Operating Drag", value: levers.operatingDrag, min: 0, max: 100 },
            ],
        },
        {
            id: "risk",
            title: "RISK PRESSURE",
            sliders: [
                { id: "marketVolatility", label: "Market Volatility", value: levers.marketVolatility, min: 0, max: 100 },
                { id: "executionRisk", label: "Execution Risk", value: levers.executionRisk, min: 0, max: 100 },
                { id: "fundingPressure", label: "Funding Pressure", value: levers.fundingPressure, min: 0, max: 100 },
            ],
        },
    ], [levers]);

    // ============================================================
    // UI STATE
    // ============================================================
    const [activeTab, setActiveTab] = useState<ScenarioTab>("scenarioA");
    const [horizon, setHorizon] = useState<Horizon>(12);
    const [rampType, setRampType] = useState<RampType>("immediate");
    const [compareMode, setCompareMode] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(0);

    const deltas = useMemo(() => ({
        survival: { baseline: 85, scenario: 85, delta: 0 },
        ev: { baseline: 50, scenario: 50, delta: 0 },
        runway: { baseline: 18, scenario: 18, delta: 0 },
        risk: { baseline: 25, scenario: 25, delta: 0 },
    }), []);

    // ============================================================
    // RENDER
    // ============================================================
    return (
        <div className={styles.page}>

            {/* LEFT RAIL — NEW CONTROL DECK */}
            <aside className={styles.leftRail}>
                <div className={styles.leftRailScroll}>
                    <ControlDeck
                        boxes={controlBoxes}
                        onChange={(id, value) => {
                            if (id !== "__end__") {
                                onLeverChange(id as keyof LeverState, value);
                            }
                        }}
                    />
                </div>
            </aside>

            {/* CENTER STAGE */}
            <main className={styles.centerStage}>

                {/* Mountain photo background */}
                <div className={styles.mountainBackplate} />

                <div className={styles.sceneLayer}>
                    <StudioStage scene={<StudioSceneRoot />} />
                </div>

                <div className={styles.hudLayer}>

                    <div className={styles.hudTop}>
                        <TopControlBar
                            activeTab={activeTab}
                            onTabChange={setActiveTab}
                            horizon={horizon}
                            onHorizonChange={setHorizon}
                            rampType={rampType}
                            onRampTypeChange={setRampType}
                            compareMode={compareMode}
                            onCompareModeToggle={() => setCompareMode((v) => !v)}
                        />
                    </div>

                    <div className={styles.hudRight}>
                        <DeltaSummaryPanel
                            deltas={deltas}
                            scenarioLabel={activeTab === "baseline" ? "Baseline" : activeTab === "scenarioA" ? "Scenario A" : "Scenario B"}
                            isAutoSimming={false}
                            compareMode={compareMode}
                            autoSimResult={null}
                        />
                    </div>

                    <div className={styles.hudBottom}>
                        <TimelineScrubber currentMonth={currentMonth} onChange={setCurrentMonth} />
                    </div>

                </div>
            </main>
        </div>
    );
}
