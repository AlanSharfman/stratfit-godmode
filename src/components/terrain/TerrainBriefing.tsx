import React from "react";

/**
 * TerrainBriefing
 * A concise summary of the Terrain view, highlighting what the user should look for.
 */
export default function TerrainBriefing() {
  return (
    <div className="rounded-lg bg-black/30 border border-white/10 p-4 text-white/80 text-sm">
      <h2 className="text-base font-semibold mb-2 text-white">Terrain Briefing</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>
          <span className="font-medium text-white">Systemic Balance:</span> Review the overall shape for signs of stability or stress.
        </li>
        <li>
          <span className="font-medium text-white">Execution Stress:</span> Peaks and valleys indicate areas of operational risk or opportunity.
        </li>
        <li>
          <span className="font-medium text-white">Scenario Context:</span> The terrain adapts to scenario levers, reflecting real-time changes.
        </li>
        <li>
          <span className="font-medium text-white">Hover for Detail:</span> Mouse over features for KPI-specific insights.
        </li>
      </ul>
    </div>
  );
}
