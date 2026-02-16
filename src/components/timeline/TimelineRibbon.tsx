import React from "react";
import styles from "./TimelineRibbon.module.css";

type Tick = { label: string; t: number };

const TICKS: Tick[] = [
    { label: "NOW", t: 0.0 },
    { label: "3M", t: 0.125 },
    { label: "6M", t: 0.25 },
    { label: "9M", t: 0.375 },
    { label: "12M", t: 0.5 },
    { label: "18M", t: 0.75 },
    { label: "24M", t: 1.0 },
];

export default function TimelineRibbon(props: {
    t: number;
    onChange: (t: number) => void;
    demoOn: boolean;
    onToggleDemo: () => void;
    audioOn: boolean;
    onToggleAudio: () => void;
}) {
    const { t, onChange, demoOn, onToggleDemo, audioOn, onToggleAudio } = props;

    return (
        <div className={styles.wrap} role="group" aria-label="Timeline">
            <div className={styles.left}>
                <div className={styles.title}>TIMELINE</div>

                <button
                    type="button"
                    className={`${styles.pill} ${demoOn ? styles.pillOn : ""}`}
                    onClick={onToggleDemo}
                    aria-pressed={demoOn}
                >
                    DEMO
                </button>

                <button
                    type="button"
                    className={`${styles.pill} ${audioOn ? styles.pillOn : ""}`}
                    onClick={onToggleAudio}
                    aria-pressed={audioOn}
                >
                    AUDIO
                </button>
            </div>

            <div className={styles.trackArea}>
                <div className={styles.ticks}>
                    {TICKS.map((x) => (
                        <div key={x.label} className={styles.tick}>
                            <div className={styles.tickMark} />
                            <div className={styles.tickLabel}>{x.label}</div>
                        </div>
                    ))}
                </div>

                <input
                    className={styles.slider}
                    type="range"
                    min={0}
                    max={1000}
                    value={Math.round(t * 1000)}
                    onChange={(e) => onChange(Number(e.target.value) / 1000)}
                    aria-label="Timeline scrubber"
                />

                <div className={styles.readout}>
                    <span className={styles.readoutLabel}>t</span>
                    <span className={styles.readoutValue}>{t.toFixed(3)}</span>
                </div>
            </div>
        </div>
    );
}
