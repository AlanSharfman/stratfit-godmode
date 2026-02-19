import { Vector3 } from "three"
import { getTerrainHeight } from "./terrainHeightSampler"

export function nodesToWorldXZ(nodes: any[]) {
  return nodes.map((n) => {
    const x = n.coord.x * 20
    const z = (n.coord.z - 0.5) * 20

    const height = getTerrainHeight(x, z)

    return new Vector3(
      x,
      height + 0.25, // lift path slightly above terrain
      z
    )
  })
}
