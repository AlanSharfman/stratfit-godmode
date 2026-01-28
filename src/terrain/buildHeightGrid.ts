import { generateTerrainHeight } from "@/terrain/terrainGenerator"

type BuildArgs = {
  width: number
  height: number
  segments: number
  time: number
  modifier: number
}

/**
 * Builds a flat height array that matches PlaneGeometry vertex order.
 * PlaneGeometry(w,h,segX,segY) creates (segX+1)*(segY+1) vertices in row-major order.
 */
export function buildHeightGrid({
  width,
  height,
  segments,
  time,
  modifier
}: BuildArgs): number[] {
  const vertsPerSide = segments + 1
  const out = new Array<number>(vertsPerSide * vertsPerSide)

  // PlaneGeometry ranges: x in [-width/2, width/2], y in [-height/2, height/2]
  // Vertex order: (iy * (segX+1) + ix)
  for (let iy = 0; iy < vertsPerSide; iy++) {
    const y = (iy / segments) * height - height / 2
    for (let ix = 0; ix < vertsPerSide; ix++) {
      const x = (ix / segments) * width - width / 2
      const idx = iy * vertsPerSide + ix

      out[idx] = generateTerrainHeight({
        x,
        z: y,
        time,
        modifier
      })

      if (idx === 0) {
        console.log("Sample height:", out[idx])
      }
    }
  }

  return out
}

