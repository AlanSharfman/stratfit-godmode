## Forensic Cleanup Summary

**Branch:** audit/forensic-cleanup @ 5acb5e9

| Metric | Value |
|---|---|
| Files deleted | 21 |
| Files modified | 3 |
| Lines removed | **-3,143** |
| Lines added | +462 (store merge) |
| Net | **-2,681 lines** |
| Typecheck | CLEAN |
| Build | CLEAN (1.8MB) |
| Lint-staged | PASSED |

---

### Orphan Deletions (19 files)

| Chain | Files |
|---|---|
| Terrain canvas | TerrainCanvas, TerrainStage, ClinicalSkyDome, ShadowCatcherFloor |
| Legacy trajectory path | BusinessTrajectoryPath, trajectoryUtils |
| Dead scene system | SceneHost, sceneRegistry |
| Dead terrain generator | terrainGenerator, buildHeightGrid |
| Unused terrain UI | AIPanel, TerrainBriefing, StrategicMetrics, terrain/index.ts |
| Orphan insights | RiskWeatherPanel |
| Orphan Monte Carlo | MonteCarloParticleField |
| Duplicate AI | ai/AIInterventionSuggestions + CSS |
| Orphan mock | scenarioImpactMock |

### Store Consolidation

| Action | Detail |
|---|---|
| DELETE | simulationStore.interface.ts — duplicate store instance, 0 consumers |
| MERGE | weatherStore.ts absorbed into riskWeatherStore.ts (unified domain store) |
| UPDATE | RiskWeatherSystem.tsx import updated to unified store |

### Architecture After Cleanup

Engine -> Store -> Projection -> UI (single directional flow)

- **Engine layer:** trajectory, montecarlo, weather, reports
- **State layer:** trajectoryStore, simulationStore, riskWeatherStore, monteCarloStore, playbackStore
- **UI layer:** terrain visualisation, insights panels, executive overlays

**Store Count: 23 -> 21**

### Verified
- npm run typecheck — CLEAN
- npm run build — CLEAN (1.8MB bundle)
- npx eslint — no new errors (1 pre-existing precision warning)

> **DO NOT MERGE** until runtime smoke test confirms no regressions.
