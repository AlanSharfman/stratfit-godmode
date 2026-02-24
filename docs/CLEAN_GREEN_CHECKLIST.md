# STRATFIT — CLEAN GREEN CHECKLIST

## Build Health
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run build` passes
- [ ] Git working tree clean

## Authority
- [ ] Only ONE navigation source (`liveNav.ts`)
- [ ] Only ONE route contract (`routeContract.ts`)
- [ ] Only ONE AppRouter implementation
- [ ] Only ONE runSimulation entry point

## Demo Safety
- [ ] Error boundary wraps `<Routes>`
- [ ] Error boundary wraps `<TerrainStage>`
- [ ] Error boundary wraps `<SimulationPresenceLayer>`
- [ ] No white-screen crash possible

## Data Integrity
- [ ] No dummy outputs shown OR clearly labelled preview
- [ ] Baseline loads correctly
- [ ] Simulation presence triggers

## Code Hygiene
- [ ] Duplicate configs moved to `/legacy`
- [ ] Stub components marked `LEGACY`
- [ ] Console noise acceptable for demo
- [ ] No dead routes referenced

## Final Check
- [ ] Position → Compass → Studio → Compare → Assessment → Roadmap flow works
