// src/pages/MountainTestPage.tsx
// MOUNTAIN TEST MODE — Isolated testing environment for Compare Mountain
// Access via: Add ?test=mountain to URL or set localStorage.setItem('MOUNTAIN_TEST', '1')

import React, { useState } from 'react';
import GodModeCompare from '@/components/mountain/GodModeCompare';

export default function MountainTestPage() {
  const [showControls, setShowControls] = useState(true);

  return (
    <div className="w-screen h-screen bg-[#050810] overflow-hidden">
      {/* TEST CONTROLS */}
      {showControls && (
        <div 
          className="fixed top-4 right-4 z-50 p-4 rounded-xl"
          style={{
            background: 'rgba(10,15,25,0.95)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(0,255,255,0.2)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-bold tracking-[0.2em] text-emerald-400">
              MOUNTAIN TEST MODE
            </span>
          </div>
          
          <div className="text-[9px] text-white/60 mb-3">
            Isolated component testing environment
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => window.location.reload()}
              className="px-3 py-1.5 text-[10px] font-bold tracking-wider bg-cyan-500/20 text-cyan-400 rounded border border-cyan-500/30 hover:bg-cyan-500/30 transition"
            >
              ↻ RELOAD
            </button>
            
            <button
              onClick={() => {
                localStorage.removeItem('MOUNTAIN_TEST');
                window.location.href = '/';
              }}
              className="px-3 py-1.5 text-[10px] font-bold tracking-wider bg-amber-500/20 text-amber-400 rounded border border-amber-500/30 hover:bg-amber-500/30 transition"
            >
              ← EXIT TEST
            </button>
            
            <button
              onClick={() => setShowControls(false)}
              className="px-3 py-1.5 text-[10px] font-bold tracking-wider bg-white/10 text-white/60 rounded border border-white/20 hover:bg-white/20 transition"
            >
              HIDE PANEL
            </button>
          </div>
        </div>
      )}

      {/* SHOW PANEL BUTTON (when hidden) */}
      {!showControls && (
        <button
          onClick={() => setShowControls(true)}
          className="fixed top-4 right-4 z-50 w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30 transition flex items-center justify-center text-lg"
        >
          ⚙
        </button>
      )}

      {/* THE MOUNTAIN (Full screen) */}
      <div className="w-full h-full">
        <GodModeCompare />
      </div>
    </div>
  );
}

