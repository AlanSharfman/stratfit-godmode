import React from "react";
import DualMountainInstrument from "./DualMountainInstrument";

/**
 * Compatibility wrapper for legacy imports.
 * The app imports `{ GodModeMountain }` from this module.
 */
export function GodModeMountain() {
  return <DualMountainInstrument />;
}

export default GodModeMountain;


