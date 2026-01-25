// src/pages/CinematicDemo.tsx
// STRATFIT — Standalone demo page for Cinematic Mountain
// Use this to showcase the visualization

import React from 'react';
import ScenarioMountainCinematic from '@/components/mountain/ScenarioMountainCinematic';

export default function CinematicDemo() {
  const handleSave = () => {
    console.log('Save clicked');
    // Connect to your save logic
  };
  
  const handleShare = () => {
    console.log('Share clicked');
    // Connect to your share logic
  };

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh',
      overflow: 'hidden',
    }}>
      <ScenarioMountainCinematic 
        showRiskPanel={true}
        showVariancePanel={true}
        onSave={handleSave}
        onShare={handleShare}
      />
    </div>
  );
}

