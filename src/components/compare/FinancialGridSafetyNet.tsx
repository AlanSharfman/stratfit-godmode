// src/components/compare/FinancialGridSafetyNet.tsx
// The Safety Net — Enterprise Spreadsheet View Fallback

import React from 'react';

export const FinancialGridSafetyNet = () => (
  <div className="w-full h-full p-8 flex flex-col gap-6 bg-[#0b1221] animate-in fade-in duration-300">
    <div className="flex justify-between items-end border-b border-slate-800 pb-4">
      <div>
        <h3 className="text-sm text-slate-400 uppercase tracking-widest font-semibold">Financial Projection Grid</h3>
        <p className="text-[10px] text-slate-600 mt-1">Standard GAAP View • Monthly Resolution</p>
      </div>
      <div className="text-[10px] text-slate-400 bg-slate-800 px-2 py-1 rounded border border-slate-700">
        EXCEL EXPORT READY
      </div>
    </div>
    
    <div className="grid grid-cols-12 gap-px bg-slate-800 border border-slate-800 rounded-lg overflow-hidden font-mono">
      {/* Header Row */}
      {['METRIC', 'NOW', 'M+6', 'M+12', 'M+18', 'M+24', 'M+30', 'M+36', 'DELTA', 'CAGR', 'RISK', 'STATUS'].map((h, i) => (
        <div key={i} className={`bg-[#0f172a] p-3 text-[9px] font-bold text-slate-500 ${i===0 ? 'col-span-2' : 'col-span-1'} flex items-center justify-end`}>
          {h}
        </div>
      ))}
      
      {/* Data Row 1 (Revenue) */}
      <div className="col-span-2 bg-[#0b1221] p-3 text-[10px] text-white font-medium flex items-center border-t border-slate-800/50">ARR (Revenue)</div>
      {[2.1, 2.8, 3.5, 4.8, 6.2, 7.1, 8.1, '+14%', '112%', 'LOW', 'OK'].map((v, i) => (
        <div key={i} className="col-span-1 bg-[#0b1221] p-3 text-[10px] text-slate-300 text-right border-t border-slate-800/50 border-l border-slate-800/50">
          {typeof v === 'number' && i < 7 ? `$${v}M` : v}
        </div>
      ))}
      
      {/* Data Row 2 (Burn) */}
      <div className="col-span-2 bg-[#0b1221] p-3 text-[10px] text-white font-medium flex items-center border-t border-slate-800/50">Net Burn</div>
      {[-0.4, -0.5, -0.6, -0.8, -0.9, -0.7, -0.4, '-12%', 'N/A', 'MED', 'OK'].map((v, i) => (
        <div key={i} className="col-span-1 bg-[#0b1221] p-3 text-[10px] text-slate-300 text-right border-t border-slate-800/50 border-l border-slate-800/50">
          {typeof v === 'number' && i < 7 ? `$${v}M` : v}
        </div>
      ))}

      {/* Data Row 3 (Cash) */}
      <div className="col-span-2 bg-[#0b1221] p-3 text-[10px] text-white font-medium flex items-center border-t border-slate-800/50">Cash Runway</div>
      {[24, 21, 18, 14, 10, 8, 14, '-10mo', 'N/A', 'HIGH', 'ALERT'].map((v, i) => (
        <div key={i} className={`col-span-1 bg-[#0b1221] p-3 text-[10px] text-right border-t border-slate-800/50 border-l border-slate-800/50 ${v === 'ALERT' ? 'text-amber-500' : 'text-slate-300'}`}>
          {typeof v === 'number' && i < 7 ? `${v} mo` : v}
        </div>
      ))}
    </div>
  </div>
);

