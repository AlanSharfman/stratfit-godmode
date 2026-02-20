// STRATFIT — God Mode palette
// Cyan is your world accent; path must be distinct.
// Use Indigo/Violet for strategic trajectory (per your rules).

export const GOD = {
  bg: "#05070A",
  terrainBase: "#060B12",
  terrainWire: "#00E0FF", // keep cyan for grid accents
  horizon: "#070A10",

  // Path (distinct from cyan)
  pathCore: "#F2FBFF", // ice-white core
  pathEnergy: "#7C3AED", // indigo/violet glow (distinct)
  pathHalo: "#BFA7FF", // soft violet halo

  // Timeline halos
  halo: "#9FF3FF", // light ice halo
} as const;
