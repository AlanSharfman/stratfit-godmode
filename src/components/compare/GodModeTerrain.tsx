import React from "react";
import ComparePage from "./ComparePage";

/**
 * Compatibility wrapper for the existing "compare" center view.
 * The rest of the app expects a default-exported `GodModeTerrain` component.
 */
export default function GodModeTerrain() {
  return <ComparePage />;
}


