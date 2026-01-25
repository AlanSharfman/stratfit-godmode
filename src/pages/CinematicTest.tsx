// src/pages/CinematicTest.tsx
// Test page - visit /cinematic to see the new mountain
// This doesn't change ANY existing code

import ScenarioMountainCinematic from '@/components/mountain/ScenarioMountainCinematic';

export default function CinematicTest() {
  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      background: '#0a1220',
      overflow: 'hidden'
    }}>
      <ScenarioMountainCinematic 
        showRiskPanel={true}
        showVariancePanel={true}
        onSave={() => alert('Save clicked')}
        onShare={() => alert('Share clicked')}
      />
    </div>
  );
}

