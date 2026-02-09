// src/components/terrain/AIPanel.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — AI Panel Wrapper
// Now delegates to the canonical SystemCommentaryPanel which consumes
// SystemAnalysisSnapshot only (via useSystemAnalysis hook).
//
// LEGACY: Previously wrapped AIIntelligenceEnhanced. That component is
// now quarantined and should not be imported.
// ═══════════════════════════════════════════════════════════════════════════

import React from "react";
import SystemCommentaryPanel from "@/components/intelligence/SystemCommentaryPanel";
import { useSystemAnalysis } from "@/hooks/useSystemAnalysis";

/**
 * AIPanel — wrapper that reads the system analysis snapshot and passes
 * it to SystemCommentaryPanel as a prop.
 */
export default function AIPanel() {
  const { analysis } = useSystemAnalysis();
  return <SystemCommentaryPanel snapshot={analysis} />;
}
