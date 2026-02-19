import { createSeed } from "./seed"
import { sampleTerrainHeight } from "./buildTerrain"
import { getStmEnabled, sampleStmDisplacement } from "@/render/stm/stmRuntime"

const BASELINE_SEED = createSeed("baseline")

export function getTerrainHeight(x: number, z: number) {
  const base = sampleTerrainHeight(x, z, BASELINE_SEED)
  const stm = getStmEnabled() ? sampleStmDisplacement(x, z) : 0
  return base + stm
}
