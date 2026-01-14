
import React from "react";
import styles from "./ScenarioIntelligencePanel.module.css";

export default function ScenarioIntelligencePanel() {
  // Minimal placeholder values for build success
  const tiles = {
    scenarioLabel: "Scenario",
    runway: "—",
    growth: "—",
    arr: "—",
    risk: "—",
    quality: "—",
  };
  const bands = {
    runway: "—",
    growth: "—",
    risk: "—",
  };
  const activeLeverId = null;


  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <strong>{tiles.scenarioLabel}</strong>
        <span>{activeLeverId ? "LIVE" : "SYNCED"}</span>
      </div>

      <div className={styles.tiles}>
        <div>Runway: {tiles.runway}</div>
        <div>Growth: {tiles.growth}</div>
        <div>ARR: {tiles.arr}</div>
        <div>Risk: {tiles.risk}</div>
        <div>Quality: {tiles.quality}</div>
      </div>

      <div className={styles.bands}>
        <div>Runway band: {bands.runway}</div>
        <div>Growth band: {bands.growth}</div>
        <div>Risk band: {bands.risk}</div>
      </div>
    </div>
  );
}


