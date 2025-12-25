import React from "react";

/**
 * BriefingPanel
 * A flexible panel for displaying context-specific briefings or summaries.
 * Place any content as children.
 */
export default function BriefingPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-5 text-white/90 shadow-md">
      {children}
    </div>
  );
}
