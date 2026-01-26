// src/pages/DormantTest.tsx
// TEST PAGE — View the Dormant Instrument mountain in isolation
// Access via: window.location.href = '/dormant-test' or import in App.tsx

import React from 'react';
import DormantInstrument from '@/components/mountain/DormantInstrument';

export default function DormantTest() {
  return (
    <div className="w-screen h-screen bg-[#030508]">
      {/* TEST MODE BADGE */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
        <div 
          className="px-4 py-2 rounded-full"
          style={{
            background: 'rgba(10,15,25,0.9)',
            border: '1px solid rgba(0,255,255,0.2)',
          }}
        >
          <span className="text-[10px] font-bold tracking-[0.2em] text-cyan-400">
            DORMANT INSTRUMENT TEST
          </span>
        </div>
      </div>
      
      {/* EXIT BUTTON */}
      <button
        onClick={() => window.history.back()}
        className="fixed top-4 right-4 z-50 px-3 py-1.5 text-[10px] font-bold tracking-wider bg-white/10 text-white/60 rounded border border-white/20 hover:bg-white/20 transition"
      >
        ← BACK
      </button>
      
      {/* THE DORMANT INSTRUMENT */}
      <DormantInstrument />
    </div>
  );
}

