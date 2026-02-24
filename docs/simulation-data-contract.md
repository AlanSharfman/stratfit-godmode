# STRATFIT Simulation Data Contract

## 1. CanonicalSimulationOutput
Purpose: Engine truth used by terrain + signals

Store: useCanonicalOutputStore

Contains:
- survivalProbability
- confidenceIndex
- volatility
- distributions
- liquidity
- valuation

Consumers:
- Terrain renderer
- Heatmaps
- Signals
- Strategic layers


## 2. SimulationSnapshot
Purpose: Scenario-level packaged results

Store: scenarioStore

Contains:
- survivalRate
- medianRunway
- ARR percentiles
- rating
- sensitivity
- time series

Consumers:
- Panels
- Narrative
- Compare
- Saved scenarios


## Golden Rule
Canonical drives physics.
Snapshot drives interpretation.
Never cross-read.
