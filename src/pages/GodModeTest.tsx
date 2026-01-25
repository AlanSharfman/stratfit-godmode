// src/pages/GodModeTest.tsx
// Test page for the Gemini-corrected God Mode Mountain
// Visit /godmode to see the holographic glass terrain with lava rivers

import GodModeMountain from '@/components/mountain/GodModeMountain';

export default function GodModeTest() {
  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      background: '#050a12',
      overflow: 'hidden'
    }}>
      <GodModeMountain />
    </div>
  );
}
